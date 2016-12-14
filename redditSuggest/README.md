
make backup:
`pg_dump -t comments_tmp postgres > "comments_tmp_`date +"%Y-%m-%d-%H:%M:%S"`.sql"`

restore backup:
`psql yawhide < comments_tmp_2016-12-11-18\:14\:54.sql`
