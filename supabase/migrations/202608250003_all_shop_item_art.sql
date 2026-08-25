-- Connect every active equipment item to its build-specific 2D RPG artwork.
-- Tempestade Astral was published previously as PNG; the remaining builds use WebP.
update public.v2_shop_items
set
  image_url = '/items/' ||
    regexp_replace(
      slug,
      '-(head|torso|hands|legs|feet|main-weapon|off-weapon|necklace|ring|earring|cape)$',
      ''
    ) || '/' || replace(slot, '_', '-') || '.webp',
  updated_at = now()
where active = true
  and slot <> 'title'
  and slug not like 'tempestade-astral-%';
