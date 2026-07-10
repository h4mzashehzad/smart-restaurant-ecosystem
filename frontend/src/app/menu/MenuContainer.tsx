'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { usePayment } from '@/contexts/PaymentContext';
import { CategorySlider } from '@/components/Menu/CategorySlider';
import { ProductCard } from '@/components/Menu/ProductCard';
import { ItemDetailDrawer } from '@/components/Menu/ItemDetailDrawer';
import { CartFab } from '@/components/cart/CartFab';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FeedbackDrawer } from '@/components/customer/FeedbackDrawer';

export function MenuContainer() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailItemId, setDetailItemId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { addItem } = useCart();
  const payment = usePayment();

  useEffect(() => {
    if (payment.drawerOpen) {
      setCartOpen(true);
    }
  }, [payment.drawerOpen]);

  // Resume split tracker after Safepay redirect (or deep-link).
  useEffect(() => {
    if (searchParams.get('split') !== '1') return;
    void payment.refreshBill({ openDrawer: true });
    setCartOpen(true);
    router.replace('/menu', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const [menuData, recData] = await Promise.all([
          api.getMenu(1), // 1 is for Lahore Karahi
          api.getRecommendations().catch(() => null)
        ]);
        
        let allCategories = menuData || [];
        
        if (recData && recData.success && recData.data?.length > 0) {
          const isAi = recData.source === 'ai';
          const recCategory = {
            id: -1,
            name: isAi ? 'Recommended for You' : 'Popular Items',
            description: isAi ? 'Handpicked items just for you based on your taste' : 'Our most loved and frequently ordered dishes',
            menu_items: recData.data.map((item: any) => ({
              ...item,
              _is_recommendation: isAi,
            })),
          };
          allCategories = [recCategory, ...allCategories];
        }
        
        setCategories(allCategories);
        if (allCategories && allCategories.length > 0) {
          setActiveCategoryId(allCategories[0].id);
        }
      } catch (err) {
        setError('Failed to load menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      base_price: parseFloat(item.base_price),
      image_url: item.image_url ?? null,
      is_signature: item.is_signature ?? false,
      unitPrice: parseFloat(item.base_price),
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-24 h-10 bg-gray-200 rounded-2xl shrink-0"></div>
          <div className="w-24 h-10 bg-gray-200 rounded-2xl shrink-0"></div>
          <div className="w-24 h-10 bg-gray-200 rounded-2xl shrink-0"></div>
        </div>
        <div className="grid gap-6">
          <div className="w-full h-40 bg-gray-200 rounded-3xl"></div>
          <div className="w-full h-40 bg-gray-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 mt-10 text-center text-red-500 font-medium bg-red-50 mx-4 rounded-2xl border border-red-100">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        No menu items available currently.
      </div>
    );
  }

  return (
    <>
      <div className="pb-32">
        {/* Category Slider Component */}
        <CategorySlider
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />

        {/* Main Category Display */}
        <div className="px-4 pt-2">
          {activeCategory && (
            <div className="mb-6 animate-fade-in-up">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">
                {activeCategory.name}
              </h2>
              {activeCategory.description && (
                <p className="text-sm text-gray-500 font-sans leading-relaxed">
                  {activeCategory.description}
                </p>
              )}
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeCategory?.menu_items?.map((item: any) => (
              <ProductCard
                key={item.id}
                item={item}
                onAdd={handleAddToCart}
                onViewDetail={(id) => setDetailItemId(id)}
              />
            ))}
            {activeCategory?.menu_items?.length === 0 && (
               <div className="py-8 text-center text-gray-400 text-sm w-full col-span-full bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                 No items available in this category.
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <CartFab onClick={() => setCartOpen(true)} />

      {payment.active && !payment.drawerOpen && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[45] w-full max-w-md px-4 pointer-events-none">
          <button
            type="button"
            onClick={() => {
              payment.openPaymentDrawer();
              setCartOpen(true);
            }}
            className="pointer-events-auto w-full rounded-2xl border border-orange-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg shadow-orange-500/10 text-left"
          >
            <p className="text-xs font-sans font-semibold text-orange-700">Table split in progress</p>
            <p className="text-[11px] font-sans text-stone-500 mt-0.5">
              Tap to claim items or pay your share — updates live for everyone.
            </p>
          </button>
        </div>
      )}

      {/* Item Detail Bottom Sheet */}
      <ItemDetailDrawer
        itemId={detailItemId}
        onClose={() => setDetailItemId(null)}
      />

      {/* Cart Bottom Sheet */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {/* Feedback Drawer — auto-opens when order is served */}
      <FeedbackDrawer />
    </>
  );
}
