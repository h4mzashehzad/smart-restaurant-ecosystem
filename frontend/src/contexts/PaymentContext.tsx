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
import { clearJustPaidPayload, readJustPaidPayload } from '@/lib/just-paid';

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
  orderDiscount: number;
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
  refreshBill: (opts?: { openDrawer?: boolean; forceSuccessIfPaid?: boolean }) => Promise<void>;
  /** Call after Safepay redirect to /menu?paid=1 or ?split=1. */
  resumeAfterSafepayReturn: (mode: 'paid' | 'split') => void;
  applyCheckoutResult: (data: {
    orderId: number;
    orderNumber: string;
    subtotal?: number;
    tax?: number;
    discount?: number;
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
  canEditClaims: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

function mapPayments(list: any[]): TrackerPayment[] {
  return (list || []).map((p: any) => ({
    id: Number(p.payment_id ?? p.id),
    participant_id: p.participant_id ?? null,
    amount: Number(p.amount),
    status: p.status || 'pending',
    payment_method: p.method ?? p.payment_method,
    receipt_url: p.receipt_url ?? null,
  }));
}

function pickReceiptForParticipant(
  receipts: Array<{ payment_id?: number; participant_id?: number | null; receipt_url?: string | null }> | undefined,
  participantId: number | null,
  paymentId: number | null,
  fallbackUrls?: Array<string | null | undefined>
): string | null {
  if (receipts?.length) {
    const byParticipant = participantId
      ? receipts.find((r) => r.participant_id === participantId)
      : undefined;
    if (byParticipant?.receipt_url) return byParticipant.receipt_url;

    const byPayment = paymentId ? receipts.find((r) => r.payment_id === paymentId) : undefined;
    if (byPayment?.receipt_url) return byPayment.receipt_url;
  }

  const first = (fallbackUrls || []).find((u) => !!u);
  return first ?? null;
}

function deriveStep(args: {
  payments: TrackerPayment[];
  claims: ClaimRecord[];
  splitType: string | null;
  sessionStatus?: string;
  allPaid?: boolean;
  pendingFullPayment?: boolean;
  participantCount?: number;
}): PaymentStep {
  if (args.allPaid) return 'success';

  // Full-bill cash/Safepay in flight — never treat this as an itemized split.
  if (args.pendingFullPayment) return 'waiting-cash';

  if (args.payments.length > 0) return 'tracker';

  // Explicit itemized split only: claims already made, or split_type locked to itemized.
  if (args.claims.length > 0 || args.splitType === 'itemized') return 'itemized';

  if (args.sessionStatus === 'checkout_pending' && args.splitType === 'equal') return 'tracker';

  // Bare checkout_pending with no claims/payments only means "split claiming" when
  // multiple guests are present (someone started split_itemized). A sole diner who
  // just created a full-pay draft must not land on the claim UI.
  if (args.sessionStatus === 'checkout_pending' && (args.participantCount ?? 0) >= 2) {
    return 'itemized';
  }

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
  const [orderDiscount, setOrderDiscount] = useState(0);
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
  const myParticipantIdRef = useRef<number | null>(null);
  const paymentIdRef = useRef<number | null>(null);
  stepRef.current = step;
  paymentIdRef.current = paymentId;

  const participants = session?.participants?.filter((p) => !p.left_at) ?? [];

  const myParticipantId = useMemo(() => {
    if (!session) return null;
    const byDevice = participants.find((p) => p.device_id === deviceId);
    if (byDevice?.id) return byDevice.id;
    if (participants.length === 1) return participants[0].id;
    return null;
  }, [session, deviceId, participants]);

  myParticipantIdRef.current = myParticipantId;

  const myPayment = useMemo(
    () => payments.find((p) => p.participant_id === myParticipantId) ?? null,
    [payments, myParticipantId]
  );

  const myShare = myPayment ? Number(myPayment.amount) : null;

  const active = step !== 'idle' && step !== 'success';

  const canEditClaims = useMemo(() => {
    if (splitMode !== 'itemized') return false;
    if (payments.length === 0) return false;
    return payments.every((p) => p.status === 'pending');
  }, [splitMode, payments]);

  const resolveAndSetReceipt = useCallback(
    async (opts?: {
      receipts?: Array<{ payment_id?: number; participant_id?: number | null; receipt_url?: string | null }>;
      fallbackUrls?: Array<string | null | undefined>;
      payment?: TrackerPayment | null;
    }) => {
      const participantId = myParticipantIdRef.current;
      const payId = opts?.payment?.id ?? paymentIdRef.current ?? myPayment?.id ?? null;

      const fromPayload = pickReceiptForParticipant(
        opts?.receipts,
        participantId,
        payId,
        opts?.fallbackUrls
      );
      // Prefer a fresh/presigned URL from the API when we have a payment id.
      if (payId) {
        try {
          const data = await api.getReceiptUrl(payId);
          if (data?.receipt_url) {
            setReceiptUrl(data.receipt_url);
            return;
          }
        } catch {
          // receipt may still be generating — fall through to cached URL
        }
      }

      if (fromPayload) {
        setReceiptUrl(fromPayload);
        return;
      }

      if (opts?.payment?.receipt_url) {
        setReceiptUrl(opts.payment.receipt_url);
      }
    },
    [myPayment?.id]
  );

  const enterSuccess = useCallback(
    (opts?: {
      orderNumber?: string;
      receipts?: Array<{ payment_id?: number; participant_id?: number | null; receipt_url?: string | null }>;
      fallbackUrls?: Array<string | null | undefined>;
      payment?: TrackerPayment | null;
    }) => {
      if (opts?.orderNumber) setOrderNumber(opts.orderNumber);

      const participantId = myParticipantIdRef.current;
      const fromReceipts = opts?.receipts?.find((r) => r.participant_id === participantId);
      const resolvedPayId =
        opts?.payment?.id ?? fromReceipts?.payment_id ?? paymentIdRef.current ?? null;
      if (resolvedPayId) setPaymentId(resolvedPayId);

      setStep('success');
      setDrawerOpen(true);
      clearCart();
      void resolveAndSetReceipt({
        ...opts,
        payment: opts?.payment ?? (resolvedPayId ? { id: resolvedPayId, participant_id: participantId, amount: 0, status: 'completed' } : null),
      });
    },
    [clearCart, resolveAndSetReceipt]
  );

  const resetPayment = useCallback(() => {
    setStep('idle');
    setSplitMode(null);
    setOrderId(null);
    setOrderNumber('');
    setOrderSubtotal(0);
    setOrderTax(0);
    setOrderDiscount(0);
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
    // Keep success visible until the guest taps Done — backdrop dismiss was dropping receipts.
    if (stepRef.current === 'success') return;
    setDrawerOpen(false);
  }, []);

  const applyBill = useCallback(
    (bill: any, opts?: { openDrawer?: boolean; forceSuccessIfPaid?: boolean }) => {
      const names: Record<number, string> = {};
      (bill.participants || []).forEach((p: any) => {
        names[p.id] = p.user?.name || `Guest ${p.id}`;
      });
      setParticipantNames(names);

      const draft = bill.draft_order;
      if (!draft) {
        // Include full-bill payments (split_group_id is null) as well as split shares.
        const completed = mapPayments(
          (bill.payments || []).filter((p: any) => p.status === 'completed')
        );
        const shouldShowSuccess =
          bill.payment_status === 'paid' &&
          completed.length > 0 &&
          (opts?.forceSuccessIfPaid ||
            stepRef.current === 'success' ||
            stepRef.current === 'tracker' ||
            stepRef.current === 'waiting-cash' ||
            stepRef.current === 'method');

        if (shouldShowSuccess) {
          const mine =
            completed.find((p) => p.participant_id === myParticipantIdRef.current) ||
            completed.find((p) => p.id === paymentIdRef.current) ||
            completed[completed.length - 1] ||
            null;
          if (mine) {
            setPayments(completed);
            setPaymentId(mine.id);
            if (mine.amount) setOrderTotal(Number(mine.amount));
          }
          enterSuccess({
            payment: mine,
            receipts: completed.map((p) => ({
              payment_id: p.id,
              participant_id: p.participant_id,
              receipt_url: p.receipt_url,
            })),
          });
        }
        return;
      }

      const mapped = mapPayments(
        (bill.payments || []).filter((p: any) => p.order_id === draft.id && p.split_group_id)
      );
      const nextClaims = bill.claims || [];
      const splitType = bill.split_type as string | null;
      const allPaid = mapped.length > 0 && mapped.every((p) => p.status === 'completed');
      const activeParticipants = (bill.participants || []).filter((p: any) => !p.left_at);
      const pendingFullPayment = (bill.payments || []).some(
        (p: any) =>
          p.order_id === draft.id &&
          !p.split_group_id &&
          ['pending', 'processing'].includes(p.status)
      );

      setOrderId(draft.id);
      setOrderNumber(draft.order_number || '');
      setOrderSubtotal(Number(draft.subtotal || 0));
      setOrderTax(Number(draft.tax_amount || 0));
      setOrderDiscount(Number(draft.discount_amount || 0));
      setOrderTotal(Number(draft.total_amount || 0));
      setUnits(bill.claimable_units || []);
      setClaims(nextClaims);
      setPayments(mapped);
      setSplitMode(splitType === 'equal' ? 'equal' : splitType === 'itemized' ? 'itemized' : null);

      if (allPaid) {
        const mine =
          mapped.find((p) => p.participant_id === myParticipantIdRef.current) || mapped[0] || null;
        if (mine) setPaymentId(mine.id);
        enterSuccess({
          orderNumber: draft.order_number || '',
          payment: mine,
          receipts: mapped.map((p) => ({
            payment_id: p.id,
            participant_id: p.participant_id,
            receipt_url: p.receipt_url,
          })),
        });
        return;
      }

      // Adopt pending full-bill payment id so cash-waiting / receipt polling stay linked.
      if (pendingFullPayment) {
        const fullPay = (bill.payments || []).find(
          (p: any) =>
            p.order_id === draft.id &&
            !p.split_group_id &&
            ['pending', 'processing'].includes(p.status)
        );
        if (fullPay) setPaymentId(Number(fullPay.payment_id ?? fullPay.id));
      }

      // Never clobber an in-progress full-pay waiting screen with a derived idle step.
      if (stepRef.current === 'waiting-cash' && pendingFullPayment) {
        return;
      }
      if (stepRef.current === 'success') {
        return;
      }

      const nextStep = deriveStep({
        payments: mapped,
        claims: nextClaims,
        splitType,
        sessionStatus: bill.session_status || session?.status,
        allPaid: false,
        pendingFullPayment,
        participantCount: activeParticipants.length,
      });

      if (nextStep !== 'idle') {
        setStep(nextStep);
        if (opts?.openDrawer !== false) {
          setDrawerOpen(true);
        }
      }
    },
    [enterSuccess, session?.status]
  );

  const refreshBill = useCallback(
    async (opts?: { openDrawer?: boolean; forceSuccessIfPaid?: boolean }) => {
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

  /** After Safepay redirect, restore success UI + receipt from one-shot sessionStorage. */
  const consumeJustPaid = useCallback(() => {
    const payload = readJustPaidPayload();
    if (!payload || !session?.id) return false;
    if (payload.sessionId !== session.id) return false;

    clearJustPaidPayload();
    setPaymentId(payload.paymentId);
    if (payload.orderNumber) setOrderNumber(payload.orderNumber);
    if (payload.amount != null) setOrderTotal(payload.amount);
    enterSuccess({
      orderNumber: payload.orderNumber,
      payment: {
        id: payload.paymentId,
        participant_id: myParticipantIdRef.current,
        amount: payload.amount ?? 0,
        status: 'completed',
        receipt_url: payload.receiptUrl,
      },
      fallbackUrls: payload.receiptUrl ? [payload.receiptUrl] : undefined,
    });
    return true;
  }, [session?.id, enterSuccess]);

  const resumeAfterSafepayReturn = useCallback(
    (mode: 'paid' | 'split') => {
      if (mode === 'paid') {
        if (consumeJustPaid()) return;
        void refreshBill({ openDrawer: true, forceSuccessIfPaid: true });
        return;
      }
      // Split share: still prefer just-paid handoff if present (receipt for this share).
      if (consumeJustPaid()) return;
      void refreshBill({ openDrawer: true });
    },
    [consumeJustPaid, refreshBill]
  );

  const beginLocalCheckout = useCallback(() => {
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
      discount?: number;
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
      if (data.discount != null) setOrderDiscount(data.discount);
      if (data.total != null) setOrderTotal(data.total);
      if (data.units) setUnits(data.units);
      if (data.claims) setClaims(data.claims);
      if (data.payments?.length) setPayments(data.payments);

      if (data.splitType === 'equal' || data.mode === 'split_equal') {
        setSplitMode('equal');
        setStep('tracker');
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

  // Poll for receipt while success is showing (generation / S3 can lag briefly).
  useEffect(() => {
    if (step !== 'success' || receiptUrl) return;
    const id = paymentId ?? myPayment?.id;
    if (!id) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        if (myPayment?.receipt_url) {
          setReceiptUrl(myPayment.receipt_url);
          return;
        }
        const data = await api.getReceiptUrl(id);
        if (!cancelled && data?.receipt_url) {
          setReceiptUrl(data.receipt_url);
          return;
        }
      } catch {
        // keep retrying
      }
      if (!cancelled && attempts < maxAttempts) {
        window.setTimeout(tick, 1500);
      }
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [step, receiptUrl, myPayment, paymentId]);

  // Initial + status-change hydrate (prefer one-shot Safepay handoff when present)
  useEffect(() => {
    if (!session?.id) {
      resetPayment();
      return;
    }
    if (consumeJustPaid()) return;
    void refreshBill({ openDrawer: false });
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

      // Full-bill checkout broadcasts are not emitted; only split drafts are.
      // Route joiners to the correct UI based on the starter's chosen mode.
      const mode = data.mode as string | undefined;
      if (mode === 'split_itemized') {
        setOrderId(data.order_id);
        setOrderNumber(data.order_number || '');
        setOrderSubtotal(Number(data.subtotal || 0));
        setOrderTax(Number(data.tax_amount || 0));
        setOrderDiscount(Number(data.discount_amount || 0));
        setOrderTotal(Number(data.total_amount || 0));
        if (data.claimable_units) setUnits(data.claimable_units);
        setSplitMode('itemized');
        setStep('itemized');
        setDrawerOpen(true);
      } else if (mode === 'split_equal') {
        setOrderId(data.order_id);
        setOrderNumber(data.order_number || '');
        setOrderSubtotal(Number(data.subtotal || 0));
        setOrderTax(Number(data.tax_amount || 0));
        setOrderDiscount(Number(data.discount_amount || 0));
        setOrderTotal(Number(data.total_amount || 0));
        setSplitMode('equal');
        // Equal split payments arrive on SplitBillConfigured shortly after.
        setStep('tracker');
        setDrawerOpen(true);
      }

      openAndRefresh();
    };
    const onConfigured = (data: any) => {
      if (data.session_id !== session.id) return;
      setOrderId(data.order_id);
      setOrderNumber(data.order_number || '');
      setOrderSubtotal(Number(data.subtotal || 0));
      setOrderTax(Number(data.tax_amount || 0));
      setOrderDiscount(Number(data.discount_amount || 0));
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
    const onUnlocked = (data: any) => {
      if (data.session_id !== session.id) return;
      setPayments([]);
      setPaymentId(null);
      setReceiptUrl(null);
      if (data.claims) setClaims(data.claims);
      if (data.claimable_units) setUnits(data.claimable_units);
      setSplitMode('itemized');
      setStep('itemized');
      setDrawerOpen(true);
      void refreshBill({ openDrawer: true });
    };
    const onCompleted = (data: any) => {
      if (data.session_id !== session.id) return;
      setPayments((prev) =>
        prev.map((p) =>
          p.id === data.payment_id
            ? { ...p, status: 'completed', receipt_url: data.receipt_url ?? p.receipt_url }
            : p
        )
      );
      // Only adopt the receipt when this device's share completed
      if (
        data.receipt_url &&
        (data.participant_id === myParticipantIdRef.current || data.payment_id === paymentIdRef.current)
      ) {
        setReceiptUrl(data.receipt_url);
        setPaymentId(data.payment_id);
      }
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
      setPayments((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
      enterSuccess({
        orderNumber: data.order_number || '',
        receipts: data.receipts,
        fallbackUrls: data.receipt_urls,
      });
    };

    socketClient.onCheckoutStarted(onCheckoutStarted);
    socketClient.onSplitBillConfigured(onConfigured);
    socketClient.onSplitBillItemClaimed(onClaimed);
    socketClient.onSplitBillUnlocked(onUnlocked);
    socketClient.onPaymentCompleted(onCompleted);
    socketClient.onPaymentFailed(onFailed);
    socketClient.onAllPaymentsCompleted(onAllPaid);

    return () => {
      socketClient.offCheckoutStarted(onCheckoutStarted);
      socketClient.offSplitBillConfigured(onConfigured);
      socketClient.offSplitBillItemClaimed(onClaimed);
      socketClient.offSplitBillUnlocked(onUnlocked);
      socketClient.offPaymentCompleted(onCompleted);
      socketClient.offPaymentFailed(onFailed);
      socketClient.offAllPaymentsCompleted(onAllPaid);
    };
  }, [session?.id, refreshBill, enterSuccess]);

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
    orderDiscount,
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
    resumeAfterSafepayReturn,
    applyCheckoutResult,
    resetPayment,
    myParticipantId,
    participantLabel,
    canEditClaims,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
};
