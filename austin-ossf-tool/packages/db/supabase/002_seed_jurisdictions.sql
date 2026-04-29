insert into jurisdictions (slug, name, county_name)
values
  ('travis-county', 'Travis County OSSF', 'Travis'),
  ('williamson-county', 'Williamson County OSSF', 'Williamson'),
  ('hays-county', 'Hays County OSSF', 'Hays'),
  ('bastrop-county', 'Bastrop County OSSF', 'Bastrop'),
  ('caldwell-county', 'Caldwell County OSSF', 'Caldwell')
on conflict (slug) do nothing;
