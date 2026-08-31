-- Estrutura de honrarias: preserva os títulos atuais e completa seus metadados visuais.
begin;

update public.v2_shop_items
set title_style = jsonb_build_object(
  'primary', '#fff1b5',
  'secondary', '#1f7a4c',
  'glow', '#d7ad45',
  'accent', coalesce(title_style->>'primary', '#f6d765'),
  'sigil', '✦',
  'frame', 'ornate',
  'category', 'commemorative',
  'availability', 'exclusive',
  'acquisition', 'Concedido por uma conquista especial em Wonderland.',
  'animated', true
) || coalesce(title_style, '{}'::jsonb)
where slot = 'title';

alter table public.v2_shop_items
  drop constraint if exists v2_title_style_object_check;
alter table public.v2_shop_items
  add constraint v2_title_style_object_check check (
    slot <> 'title' or (
      jsonb_typeof(title_style) = 'object'
      and title_style->>'frame' in ('classic','ornate','royal','arcane','infernal')
      and title_style->>'category' in (
        'commemorative','achievement','competitive','exploration','social','legendary','administrative'
      )
      and title_style->>'availability' in ('permanent','limited','exclusive')
      and jsonb_typeof(title_style->'animated') = 'boolean'
      and char_length(title_style->>'sigil') between 1 and 4
    )
  );

comment on column public.v2_shop_items.title_style is
  'Metadados da honraria: cores, símbolo, moldura, categoria, disponibilidade, obtenção e animação.';

commit;
