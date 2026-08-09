begin;

insert into public.v2_game_settings (
  key,
  category,
  label,
  description,
  value,
  status,
  published_at
)
values (
  'combat.rules',
  'combat',
  'Regras centrais de combate',
  'Multiplicadores usados para HP, Mana, mitigação e ataque básico.',
  '{"hpPerResistance":5,"manaPerIntelligence":3,"physicalMitigationConstant":100,"magicalMitigationConstant":100,"basicAttackMultiplier":1,"minimumDamage":1}'::jsonb,
  'published',
  now()
)
on conflict (key) do nothing;

commit;
