-- EXP-001: fotos de iPhone (HEIC/HEIF). Navegadores não exibem HEIC, mas o site e o Portal nunca servem
-- o original de foto de galeria: mostram a miniatura JPEG que o próprio Drive gera (`?w=`), então a foto
-- entra na galeria como qualquer outra. Tipo provado por magic bytes (`ftyp` heic/heix/mif1...).
insert into public.file_type_allowlist (mime_type, max_bytes, gallery, uploadable, extension) values
  ('image/heic', 30 * 1024 * 1024, true, true, 'heic')
on conflict (mime_type) do nothing;
