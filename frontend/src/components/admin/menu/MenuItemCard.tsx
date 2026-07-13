'use client';

import Image from 'next/image';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { AdminMenuItem } from '@/types/admin';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatPkr(amount: number) {
  return `Rs ${Number(amount).toLocaleString('en-PK')}`;
}

interface MenuItemCardProps {
  item: AdminMenuItem;
  onToggleAvailability: (item: AdminMenuItem, available: boolean) => void;
  onEdit: (item: AdminMenuItem) => void;
  onPreview: (item: AdminMenuItem) => void;
  onDelete: (item: AdminMenuItem) => void;
  toggling?: boolean;
}

export function MenuItemCard({
  item,
  onToggleAvailability,
  onEdit,
  onPreview,
  onDelete,
  toggling,
}: MenuItemCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:border-orange-500/30',
        !item.is_available && 'opacity-75'
      )}
    >
      <div className="relative mb-4 h-40 w-full overflow-hidden rounded-2xl bg-gray-50">
        {item.image_url ? (
          <Image
            key={`${item.id}-${item.updated_at ?? ''}-${item.image_url}`}
            src={
              item.updated_at
                ? `${item.image_url}${item.image_url.includes('?') ? '&' : '?'}v=${encodeURIComponent(item.updated_at)}`
                : item.image_url
            }
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-12 w-12">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 15.75V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75v-3z"
              />
            </svg>
          </div>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-orange-500">
            {item.name}
          </h3>
          {item.is_signature && (
            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Signature
            </span>
          )}
        </div>

        {item.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {item.is_vegetarian && (
            <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              Veg
            </span>
          )}
          {item.is_vegan && (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Vegan
            </span>
          )}
          {item.is_gluten_free && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              GF
            </span>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">{formatPkr(item.base_price)}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                {item.is_available ? 'Available' : 'Off'}
              </span>
              <Switch
                checked={item.is_available}
                disabled={toggling}
                onCheckedChange={(checked) => onToggleAvailability(item, checked)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-gray-200"
              onClick={() => onPreview(item)}
              aria-label={`Preview ${item.name}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
