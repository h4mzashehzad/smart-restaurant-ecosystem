'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { CategorySlider } from '@/components/Menu/CategorySlider';
import { ProductCard } from '@/components/Menu/ProductCard';

export function MenuContainer() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMenu() {
      try {
        const data = await api.getMenu(1); // 1 is for Lahore Karahi
        setCategories(data);
        if (data && data.length > 0) {
          setActiveCategoryId(data[0].id);
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
    // In future this will add item to Cart context
    console.log('Added to cart', item);
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
    <div className="pb-24">
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
  );
}
