-- Preserve uncategorized legacy documents for review in the CMS.
alter table public.contact_documents
  add column category text check (category in ('trips', 'camps', 'organizer'));

-- Classify only the titles verified in the existing public library; retain all
-- other documents unchanged for an administrator to review.
update public.contact_documents
set category = case title
  when 'Ogólne Warunki Uczestnictwa w Imprezie Turystycznej' then 'trips'
  when 'Standardowy Formularz Informacyjny' then 'trips'
  when 'Ogólne Warunki Ubezpieczenia NNW' then 'trips'
  when 'Ogólne Warunki Ubezpieczenia “Bezpieczne rezerwacje”' then 'trips'
  when 'Standardy Ochrony Małoletnich' then 'camps'
  when 'Karta Kwalifikacyjna 2027' then 'camps'
  when 'Certyfikat Gwarancji Ubezpieczeniowej' then 'organizer'
  when 'Klauzula Informacyjna dot. Ochrony Danych Osobowych' then 'organizer'
  when 'Licencja Organizatora Turystyki' then 'organizer'
  when 'Regulamin Strony' then 'organizer'
end,
title = case title
  when 'Standardowy Formularz Informacyjny' then 'Standardowy formularz informacyjny'
  when 'Ogólne Warunki Ubezpieczenia “Bezpieczne rezerwacje”' then 'Ogólne Warunki Ubezpieczenia „Bezpieczne rezerwacje”'
  when 'Standardy Ochrony Małoletnich' then 'Standardy ochrony małoletnich'
  when 'Karta Kwalifikacyjna 2027' then 'Karta kwalifikacyjna 2027'
  when 'Regulamin Strony' then 'Regulamin strony'
  else title
end
where title in (
  'Ogólne Warunki Uczestnictwa w Imprezie Turystycznej',
  'Standardowy Formularz Informacyjny',
  'Ogólne Warunki Ubezpieczenia NNW',
  'Ogólne Warunki Ubezpieczenia “Bezpieczne rezerwacje”',
  'Standardy Ochrony Małoletnich',
  'Karta Kwalifikacyjna 2027',
  'Certyfikat Gwarancji Ubezpieczeniowej',
  'Klauzula Informacyjna dot. Ochrony Danych Osobowych',
  'Licencja Organizatora Turystyki',
  'Regulamin Strony'
);
