const async = require('async');
const config = require('../config');
const fs = require('fs');
const log = require('better-logs')('pg-multiple-values');
const pg = require('pg');
const pgFormat = require('pg-format');

let pool = new pg.Pool(config.pg);

function dropTable(cb) {
  pool.query(
    `DROP TABLE c_tmp;`,
    (err, result) => {
      log.debug(err, result);
      cb(err);
    }
  );
}

function createTable(cb) {
  pool.query(
    `CREATE TABLE c_tmp (html TEXT, comment_id varchar(30));`,
    (err, result) => {
      log.debug(err, result);
      cb(err);
    }
  );
}

function insert(cb) {
  let sql = pgFormat(`
      INSERT INTO c_tmp (html, comment_id) VALUES %L;
    `,[
    [`&lt;div class="md"&gt;&lt;p&gt;Thanks, I will try to get that fixed! :)&lt;/p&gt; div class='md'`, '1'],
    [`&lt;p&gt;It also has a good build quality (aluminum case), an IPS screen and more than 10 hours of battery according to &lt;a href="http://www.notebookcheck.net/Asus-Zenbook-UX330UA-Notebook-Review.182710.0.html"&gt;this review&lt;/a&gt;. &lt;/p&gt; div class='1'`, '2'],
    [`&lt;!-- SC_OFF --&gt;&lt;div class=\"md\"&gt;&lt;ul&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Total budget and country of purchase:&lt;/strong&gt; \nUS.  Can go up to $1000 (after tax), but definitely don&amp;#39;t need to spend that much&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Do you prefer a 2 in 1 form factor, good battery life or best specifications to your requirements for the money? Pick or include any that apply.&lt;/strong&gt; \nGood battery life is important.  2-in-1 would be icing but not at the expense of battery, weight or specs&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;How important is weight to you?&lt;/strong&gt;\nLighter the better&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Which OS do you require? Windows, Linux, Mac.&lt;/strong&gt;\nAt this price, I don&amp;#39;t think I&amp;#39;ll be able to go Mac.  It&amp;#39;s preferable, but can&amp;#39;t go over $1,000&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Do you have a preferred screen size? If indifferent, put N/A.&lt;/strong&gt; \n13-15&amp;quot;; nothing bigger, nothing smaller&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Are you doing any CAD/video editing/photo editing/gaming? List which programs/games you desire to run. If you have no requirements, put N/A.&lt;/strong&gt; \nFor the most part, using it for light video creating, Internet, word processing.  Wouldn&amp;#39;t mind it being able to play some games (Civ, Cities, mostly sim-based stuff)&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;If you&amp;#39;re gaming (leave blank if you put N/A above...), do you have certain games you want to play? At what settings and FPS do you want?&lt;/strong&gt; \nSee previous question&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Any specific requirements such as good keyboard, reliable business grade build quality, touch-screen, finger-print reader, optical drive or good input devices (keyboard/touchpad)?&lt;/strong&gt; \nI&amp;#39;m thinking SSD might be useful since it&amp;#39;ll be in a backpack and used on the go.  Needs to have projection capabilities.&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Leave any finishing thoughts here that you may feel are necessary and beneficial to the discussion.&lt;/strong&gt;\nI wouldn&amp;#39;t mind spending a little less if it meant I could get a projector along with it.  The projector isn&amp;#39;t necessary, so if there&amp;#39;s a big difference between $600 with a projector and $900 without a projector, go without.  A nice bag that could hold both the projector and computer would be nice as well!!&lt;/p&gt;&lt;/li&gt;\n&lt;/ul&gt;\n\n&lt;p&gt;Something that will stand the basic test-of-time.  Games are last resort; so I&amp;#39;m not looking for specs stand the test-of-time, but quality that will last and/or specs that let me do video/Google Apps stuff.&lt;/p&gt;\n&lt;/div&gt;&lt;!-- SC_ON --&gt;`, '3'], [`* **Total budget and country of purchase:** \nUS.  Can go up to $1000 (after tax), but definitely don't need to spend that much\n\n* **Do you prefer a 2 in 1 form factor, good battery life or best specifications to your requirements for the money? Pick or include any that apply.** \nGood battery life is important.  2-in-1 would be icing but not at the expense of battery, weight or specs\n\n* **How important is weight to you?**\nLighter the better\n\n* **Which OS do you require? Windows, Linux, Mac.**\nAt this price, I don't think I'll be able to go Mac.  It's preferable, but can't go over $1,000\n\n* **Do you have a preferred screen size? If indifferent, put N/A.** \n13-15\"; nothing bigger, nothing smaller\n\n* **Are you doing any CAD/video editing/photo editing/gaming? List which programs/games you desire to run. If you have no requirements, put N/A.** \nFor the most part, using it for light video creating, Internet, word processing.  Wouldn't mind it being able to play some games (Civ, Cities, mostly sim-based stuff)\n\n* **If you're gaming (leave blank if you put N/A above...), do you have certain games you want to play? At what settings and FPS do you want?** \nSee previous question\n\n* **Any specific requirements such as good keyboard, reliable business grade build quality, touch-screen, finger-print reader, optical drive or good input devices (keyboard/touchpad)?** \nI'm thinking SSD might be useful since it'll be in a backpack and used on the go.  Needs to have projection capabilities.\n\n* **Leave any finishing thoughts here that you may feel are necessary and beneficial to the discussion.**\nI wouldn't mind spending a little less if it meant I could get a projector along with it.  The projector isn't necessary, so if there's a big difference between $600 with a projector and $900 without a projector, go without.  A nice bag that could hold both the projector and computer would be nice as well!!\n\nSomething that will stand the basic test-of-time.  Games are last resort; so I'm not looking for specs stand the test-of-time, but quality that will last and/or specs that let me do video/Google Apps stuff.`, '4'],
    [`&lt;div class=\"md\"&gt;&lt;p&gt;What about the &lt;a href=\"https://shopineer.com/laptops/Dell-15-6-Inch-Gaming-Laptop-i7559-763BLK\"&gt;DELL Inspiron i7559-763BLK&lt;/a&gt;?&lt;/p&gt;\n\n&lt;p&gt;Intel i5-6300HQ 2.3 GHz Quad-Core, 15.6&amp;quot;, 8 GB RAM, 256 GB SSD, NVIDIA GeForce GTX 960M 4GB GDDR5, Windows 10, 5.67 lbs.&lt;/p&gt;\n\n&lt;p&gt;It also has a good battery life, an IPS screen and a good cooling system.  You can quite easily upgrade RAM later on if required. &lt;/p&gt;\n\n&lt;p&gt;The 960M should be able to handle these games quite well (including Civ 6), and it can also run some heavier ones.&lt;/p&gt;\n\n&lt;p&gt;Alternatively, for a lighter option, what about the &lt;a href=\"https://shopineer.com/laptops/ASUS-K501UW-AB78-15-6-inch-Full-HD-Gaming-Laptop\"&gt;ASUS K501UW-AB78&lt;/a&gt;?&lt;/p&gt;\n\n&lt;p&gt;6th-generation Intel Core i7-6500U 2.5GHz, 8 GB RAM, 512 GB SSD, NVIDIA GeForce GTX 960M gaming graphic card, Windows 10 (64bit), 4.4 lbs.&lt;/p&gt;\n\n&lt;p&gt;It also has a good build quality (aluminum case). &lt;/p&gt;\n&lt;/div&gt;`, '5'],
    [`&lt;div class=\"md\"&gt;&lt;p&gt;Since gaming is not important I would recommend either The &lt;strong&gt;&lt;a href=\"https://www.amazon.com/dp/B01ER4ARCU/ref=as_li_ss_tl?ie=UTF8&amp;amp;linkCode=ll1&amp;amp;tag=bkadamos-20&amp;amp;linkId=20f2f299a8fd9b1e40b2360f000a1a56\"&gt;Acer Aspire R 14&lt;/a&gt;&lt;/strong&gt; because it has a 14% off deal right now and it already offered great value for money, it comes with the usual specs for the size, 14&amp;quot; Full HD Touch, Intel dual Core i5 which is powerful enough for most college usage, 8GB Memory which is enough ram for smooth multi tasking, 256GB SSD very good for faster booting and and overall performance just like you wanted, Intel HD Graphics 520 good for light gaming/photo editing, a little heavy at 4.2 lbs, good battery life at 5-7 hours with light to medium usage, above average build quality, has 2 in 1 feature, comes with USB type C, and great price tag.&lt;/p&gt;\n\n&lt;p&gt;Or The &lt;strong&gt;&lt;a href=\"https://www.amazon.com/Acer-Touch-Windows-Convertible-SP513-51-55ZR/dp/B01M18YU9I/ref=as_li_ss_tl?ie=UTF8&amp;amp;linkCode=ll1&amp;amp;tag=lonerim2-20&amp;amp;linkId=a8b797bef71e2f8d3c0401d9c07b4942\"&gt;Acer Spin 5&lt;/a&gt;&lt;/strong&gt; because it offers great value for money, and it comes with very similar specs, it comes with Intel Core i5-6200U Processor just like the other acer, Intel HD Graphics 520 good for light gaming/photo editing , 8GB of ram which is enough ram for smooth multi tasking, 256GB of SSD for faster booting and and overall performance, very good battery life at 7-10 hours with light to medium usage, very good build quality with metal cover, (1920 x 1080) resolution with 13.3 inch screen, it is also light weight at 3.53 lbs, and it has 2 in 1 feature with 4 modes which a nice bonus and can work with acer active stylus combined with 2 in 1 feature just like you wanted.&lt;/p&gt;\n&lt;/div&gt;`, '6']]);
  log.debug(sql)
  pool.query(
    sql,
    // `
    //   INSERT INTO c_tmp (html, comment_id) VALUES ($1), ($2);
    // `,
    // [[`&lt;div class="md"&gt;&lt;p&gt;Thanks, I will try to get that fixed! :)&lt;/p&gt; div class='md'`, '1'], [`&lt;p&gt;It also has a good build quality (aluminum case), an IPS screen and more than 10 hours of battery according to &lt;a href="http://www.notebookcheck.net/Asus-Zenbook-UX330UA-Notebook-Review.182710.0.html"&gt;this review&lt;/a&gt;. &lt;/p&gt; div class='1'`, '2']],
    (err, result) => {
      log.debug(err, result);
      cb(err);
    }
  )
}

async.series([dropTable, createTable, insert], (err) => {

})

// pool.query(`select * from comments;`, (err, result) => {
//   fs.writeFileSync('scripts/comments_backup.json', JSON.stringify(result.rows.sort((a,b) => a.id - b.id)));
// })
