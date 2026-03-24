'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  spice_level: string;
  is_vegetarian: boolean;
  is_available: boolean;
}

export default function MenuDisplay({ restaurantId }: { restaurantId: number }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu(restaurantId);
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (itemId: number) => {
    const newCart = new Map(cart);
    newCart.set(itemId, (newCart.get(itemId) || 0) + 1);
    setCart(newCart);
  };

  const removeFromCart = (itemId: number) => {
    const newCart = new Map(cart);
    const currentQty = newCart.get(itemId) || 0;
    if (currentQty > 1) {
      newCart.set(itemId, currentQty - 1);
    } else {
      newCart.delete(itemId);
    }
    setCart(newCart);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Menu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={item.image_url || '/placeholder-food.jpg'}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                {item.is_vegetarian && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Veg
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-indigo-600">
                  Rs. {item.base_price}
                </span>
                {item.is_available ? (
                  <div className="flex items-center space-x-2">
                    {cart.get(item.id) ? (
                      <>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          -
                        </button>
                        <span className="font-semibold">{cart.get(item.id)}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-red-500 font-medium">Unavailable</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                {Array.from(cart.values()).reduce((a, b) => a + b, 0)} items in cart
              </p>
            </div>
            <button
              onClick={() => {/* Navigate to cart */}}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
