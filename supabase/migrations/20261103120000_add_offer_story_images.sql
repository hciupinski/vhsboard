alter table public.offer_images
  add column show_in_story boolean not null default false,
  add constraint offer_story_images_are_gallery check (not show_in_story or category = 'gallery');

create function public.limit_offer_story_images() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.show_in_story then
    perform 1 from public.offers where id = new.offer_id for update;
    if (select count(*) from public.offer_images
        where offer_id = new.offer_id and show_in_story and id <> new.id) >= 3 then
      raise check_violation using message = 'Można wybrać maksymalnie trzy zdjęcia przy opisie.';
    end if;
  end if;
  return new;
end;
$$;

create trigger offer_story_image_limit before insert or update of offer_id, category, show_in_story
on public.offer_images for each row execute function public.limit_offer_story_images();
