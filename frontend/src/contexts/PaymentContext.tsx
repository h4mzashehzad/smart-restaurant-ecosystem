'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useSession } from '@/contexts/SessionContext';
import { useCart } from '@/contexts/CartContext';
import type { ClaimableUnit, ClaimRecord } from '@/components/payment/ItemizedSplit';
import type { TrackerPayment } from '@/components/payment/PaymentStatusTracker';
import type { SplitMode } from '@/components/payment/SplitBillOptions';

export type PaymentStep =
  | 'idle'
  | 'method'
  | 'split-options'
  | 'itemized'
  | 'tracker'
  | 'waiting-cash'
  | 'success';

interface PaymentContextType {
  active: boolean;
  step: PaymentStep;
  setStep: (step: PaymentStep) => void;
  splitMode: SplitMode | null;
  setSplitMode: (mode: SplitMode | null) => void;
  orderId: number | null;
  orderNumber: string;
  orderSubtotal: number;
  orderTax: number;
  orderTotal: number;
  myShare: number | null;
  myPayment: TrackerPayment | null;
  units: ClaimableUnit[];
  setUnits: (units: ClaimableUnit[]) => void;
  claims: ClaimRecord[];
  setClaims: (claims: ClaimRecord[]) => void;
  payments: TrackerPayment[];
  setPayments: React.Dispatch<React.SetStateAction<TrackerPayment[]>>;
  receiptUrl: string | null;
  setReceiptUrl: (url: string | null) => void;
  paymentId: number | null;
  setPaymentId: (id: number | null) => void;
  drawerOpen: boolean;
  openPaymentDrawer: () => void;
  closePaymentDrawer: () => void;
  beginLocalCheckout: () => void;
  refreshBill: (opts?: { openDrawer?: boolean }) => Promise<void>;
  applyCheckoutResult: (data: {
    orderId: number;
    orderNumber: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    units?: ClaimableUnit[];
    claims?: ClaimRecord[];
    mode?: string;
    splitType?: string | null;
    payments?: TrackerPayment[];
  }) => void;
  resetPayment: () => void;
  myParticipantId: number | null;
  participantLabel: (participantId: number | null | undefined) => string;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

function mapPayments(list: any[]): TrackerPayment[] {
  return (list || []).map((p: any) => ({
    id: Number(p.payment_id ?? p.id),
    participant_id: p.participant_id ?? null,
    amount: Number(p.amount),
    status: p.status || 'pending',
    payment_method: p.method ?? p.payment_method,
  }));
}

function deriveStep(args: {
  payments: TrackerPayment[];
  claims: ClaimRecord[];
  splitType: string | null;
  sessionStatus?: string;
  allPaid?: boolean;
}): PaymentStep {
  if (args.allPaid) return 'success';
  if (args.payments.length > 0) return 'tracker';
  if (args.claims.length > 0 || args.splitType === 'itemized') return 'itemized';
  if (args.sessionStatus === 'checkout_pending' && args.splitType === 'equal') return 'tracker';
  if (args.sessionStatus === 'checkout_pending') return 'itemized';
  return 'idle';
}

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, deviceId } = useSession();
  const { clearCart } = useCart();

  const [step, setStep] = useState<PaymentStep>('idle');
  const [splitMode, setSplitMode] = useState<SplitMode | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderSubtotal, setOrderSubtotal] = useState(0);
  const [orderTax, setOrderTax] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [units, setUnits] = useState<ClaimableUnit[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [payments, setPayments] = useState<TrackerPayment[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [participantNames, setParticipantNames] = useState<Record<number, string>>({});

  const refreshingRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const participants = session?.participants?.filter((p) => !p.left_at) ?? [];

  const myParticipantId = useMemo(() => {
    if (!session) return null;
    const byDevice = participants.find((p) => p.device_id === deviceId);
    if (byDevice?.id) return byDevice.id;
    // Last resort: if this device has exactly one matching unpaid payment participant in session
    // and only one local participant without a device match, avoid blocking pay buttons entirely.
    if (participants.length === 1) return participants[0].id;
    return null;
  }, [session, deviceId, participants]);

  const myPayment = useMemo(
    () => payments.find((p) => p.participant_id === myParticipantId) ?? null,
    [payments, myParticipantId]
  );

  const myShare = myPayment ? Number(myPayment.amount) : null;

  const active = step !== 'idle' && step !== 'success';

  const resetPayment = useCallback(() => {
    setStep('idle');
    setSplitMode(null);
    setOrderId(null);
    setOrderNumber('');
    setOrderSubtotal(0);
    setOrderTax(0);
    setOrderTotal(0);
    setUnits([]);
    setClaims([]);
    setPayments([]);
    setReceiptUrl(null);
    setPaymentId(null);
    setDrawerOpen(false);
  }, []);

  const openPaymentDrawer = useCallback(() => setDrawerOpen(true), []);
  const closePaymentDrawer = useCallback(() => {
    if (stepRef.current === 'success') {
      resetPayment();
      return;
    }
    // Keep split state; only close the sheet so guests can reopen via FAB/banner.
    setDrawerOpen(false);
  }, [resetPayment]);

  const applyBill = useCallback(
    (bill: any, opts?: { openDrawer?: boolean }) => {
      const names: Record<number, string> = {};
      (bill.participants || []).forEach((p: any) => {
        names[p.id] = p.user?.name || `Guest ${p.id}`;
      });
      setParticipantNames(names);

      const draft = bill.draft_order;
      if (!draft) {
        if (bill.payment_status === 'paid' && stepRef.current !== 'idle') {
          setStep('success');
          if (opts?.openDrawer) setDrawerOpen(true);
        }
        return;
      }

      const mapped = mapPayments(
        (bill.payments || []).filter((p: any) => p.order_id === draft.id && p.split_group_id)
      );
      const nextClaims = bill.claims || [];
      const splitType = bill.split_type as string | null;
      const allPaid =
        mapped.length > 0 && mapped.every((p) => p.status === 'completed');

      setOrderId(draft.id);
      setOrderNumber(draft.order_number || '');
      setOrderSubtotal(Number(draft.subtotal || 0));
      setOrderTax(Number(draft.tax_amount || 0));
      setOrderTotal(Number(draft.total_amount || 0));
      setUnits(bill.claimable_units || []);
      setClaims(nextClaims);
      setPayments(mapped);
      setSplitMode(splitType === 'equal' ? 'equal' : splitType === 'itemized' ? 'itemized' : null);

      const nextStep = deriveStep({
        payments: mapped,
        claims: nextClaims,
        splitType,
        sessionStatus: bill.session_status || session?.status,
        allPaid,
      });

      if (nextStep !== 'idle') {
        setStep(nextStep);
        if (opts?.openDrawer !== false) {
          setDrawerOpen(true);
        }
      }

      if (allPaid) {
        clearCart();
      }
    },
    [clearCart, session?.status]
  );

  const refreshBill = useCallback(
    async (opts?: { openDrawer?: boolean }) => {
      if (!session?.id || refreshingRef.current) return;
      refreshingRef.current = true;
      try {
        const bill = await api.getSessionBill(session.id);
        applyBill(bill, opts);
      } catch {
        // ignore transient errors
      } finally {
        refreshingRef.current = false;
      }
    },
    [session?.id, applyBill]
  );

  const beginLocalCheckout = useCallback(() => {
    // If a split is already live, jump into it instead of showing full-bill checkout.
    if (payments.length > 0 || orderId) {
      void refreshBill({ openDrawer: true });
      setDrawerOpen(true);
      if (payments.length > 0) setStep('tracker');
      return;
    }
    setStep('method');
    setDrawerOpen(true);
  }, [payments.length, orderId, refreshBill]);

  const applyCheckoutResult = useCallback(
    (data: {
      orderId: number;
      orderNumber: string;
      subtotal?: number;
      tax?: number;
      total?: number;
      units?: ClaimableUnit[];
      claims?: ClaimRecord[];
      mode?: string;
      splitType?: string | null;
      payments?: TrackerPayment[];
    }) => {
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
      if (data.subtotal != null) setOrderSubtotal(data.subtotal);
      if (data.tax != null) setOrderTax(data.tax);
      if (data.total != null) setOrderTotal(data.total);
      if (data.units) setUnits(data.units);
      if (data.claims) setClaims(data.claims);
      if (data.payments?.length) setPayments(data.payments);

      if (data.splitType === 'equal' || data.mode === 'split_equal') {
        setSplitMode('equal');
        setStep(data.payments?.length ? 'tracker' : 'tracker');
      } else if (data.splitType === 'itemized' || data.mode === 'split_itemized') {
        setSplitMode('itemized');
        setStep(data.payments?.length ? 'tracker' : 'itemized');
      }

      setDrawerOpen(true);
    },
    []
  );

  const participantLabel = useCallback(
    (participantId: number | null | undefined) => {
      if (!participantId) return 'Guest';
      if (participantId === myParticipantId) return 'You';
      if (participantNames[participantId]) return participantNames[participantId];
      const p = participants.find((x) => x.id === participantId) as any;
      return p?.user?.name || `Guest ${participantId}`;
    },
    [myParticipantId, participantNames, participants]
  );

  // Initial + status-change hydrate
  useEffect(() => {
    if (!session?.id) {
      resetPayment();
      return;
    }
    void refreshBill({ openDrawer: false });
    // intentionally only re-hydrate when session identity/status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.status]);

  // Poll while split is active so statuses stay truthful across devices
  useEffect(() => {
    if (!session?.id || !active) return;
    const id = window.setInterval(() => {
      void refreshBill({ openDrawer: false });
    }, 4000);
    return () => window.clearInterval(id);
  }, [session?.id, active, refreshBill]);

  // Resume after returning from Safepay / tab focus
  useEffect(() => {
    if (!session?.id) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshBill({ openDrawer: stepRef.current !== 'idle' && stepRef.current !== 'method' });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [session?.id, refreshBill]);

  // Realtime: always refresh from API so amounts/statuses stay consistent
  useEffect(() => {
    if (!session?.id) return;

    const openAndRefresh = () => {
      void refreshBill({ openDrawer: true });
    };

    const onCheckoutStarted = (data: any) => {
      if (data.session_id !== session.id) return;
      openAndRefresh();
    };
    const onConfigured = (data: any) => {
      if (data.session_id !== session.id) return;
      // Apply immediately for snappy UX, then reconcile with API.
      setOrderId(data.order_id);
      setOrderNumber(data.order_number || '');
      setOrderSubtotal(Number(data.subtotal || 0));
      setOrderTax(Number(data.tax_amount || 0));
      setOrderTotal(Number(data.total_amount || 0));
      setSplitMode(data.split_type === 'equal' ? 'equal' : 'itemized');
      setPayments(mapPayments(data.participants || []));
      setStep('tracker');
      setDrawerOpen(true);
      void refreshBill({ openDrawer: true });
    };
    const onClaimed = (data: any) => {
      if (data.session_id !== session.id) return;
      if (data.claims) setClaims(data.claims);
      if (data.claimable_units) setUnits(data.claimable_units);
      setSplitMode('itemized');
      setStep((prev) => (prev === 'tracker' || prev === 'success' ? prev : 'itemized'));
      setDrawerOpen(true);
      void refreshBill({ openDrawer: true });
    };
    const onCompleted = (data: any) => {
      if (data.session_id !== session.id) return;
      setPayments((prev) =>
        prev.map((p) => (p.id === data.payment_id ? { ...p, status: 'completed' } : p))
      );
      if (data.receipt_url) setReceiptUrl(data.receipt_url);
      void refreshBill({ openDrawer: true });
    };
    const onFailed = (data: any) => {
      if (data.session_id !== session.id) return;
      setPayments((prev) =>
        prev.map((p) => (p.id === data.payment_id ? { ...p, status: 'failed' } : p))
      );
      void refreshBill({ openDrawer: true });
    };
    const onAllPaid = (data: any) => {
      if (data.session_id !== session.id) return;
      setOrderNumber(data.order_number || '');
      setReceiptUrl(data.receipt_urls?.[0] ?? null);
      setPayments((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
      setStep('success');
      setDrawerOpen(true);
      clearCart();
      void refreshBill({ openDrawer: true });
    };

    socketClient.onCheckoutStarted(onCheckoutStarted);
    socketClient.onSplitBillConfigured(onConfigured);
    socketClient.onSplitBillItemClaimed(onClaimed);
    socketClient.onPaymentCompleted(onCompleted);
    socketClient.onPaymentFailed(onFailed);
    socketClient.onAllPaymentsCompleted(onAllPaid);

    return () => {
      socketClient.offCheckoutStarted(onCheckoutStarted);
      socketClient.offSplitBillConfigured(onConfigured);
      socketClient.offSplitBillItemClaimed(onClaimed);
      socketClient.offPaymentCompleted(onCompleted);
      socketClient.offPaymentFailed(onFailed);
      socketClient.offAllPaymentsCompleted(onAllPaid);
    };
  }, [session?.id, refreshBill, clearCart]);

  const value: PaymentContextType = {
    active,
    step,
    setStep,
    splitMode,
    setSplitMode,
    orderId,
    orderNumber,
    orderSubtotal,
    orderTax,
    orderTotal,
    myShare,
    myPayment,
    units,
    setUnits,
    claims,
    setClaims,
    payments,
    setPayments,
    receiptUrl,
    setReceiptUrl,
    paymentId,
    setPaymentId,
    drawerOpen,
    openPaymentDrawer,
    closePaymentDrawer,
    beginLocalCheckout,
    refreshBill,
    applyCheckoutResult,
    resetPayment,
    myParticipantId,
    participantLabel,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
};
