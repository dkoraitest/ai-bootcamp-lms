-- Set Lesson 5 recording URL in lessons.video_url and materials.url (id = 5).
-- Safe to run multiple times.
update lessons
   set video_url = 'https://drive.google.com/file/d/1WEfexq3yVQSPFzjotOxdlNwD1BB1FoSk/view?usp=drive_link'
 where lesson_number = 5;

update materials
   set url = 'https://drive.google.com/file/d/1WEfexq3yVQSPFzjotOxdlNwD1BB1FoSk/view?usp=drive_link'
 where id = 5;
