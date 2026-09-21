/* GenVidPro — three languages, English / עברית / Русский.
   ------------------------------------------------------------------
   Only the running copy is translated: the explanations, the questions, the
   button labels. Every display heading stays English on purpose — Anton,
   Archivo Black, Bebas and Big Shoulders carry no Hebrew and no Cyrillic, so a
   translated headline would drop to a system font and the whole look would go
   with it. The dictionary is keyed by the English sentence, so a string with no
   entry is simply left alone.

   Hebrew is the awkward one and gets its own care: every translated block is
   turned round to RTL, right-aligned only where it was left-aligned (a centred
   line stays centred), and set in Heebo so it is a real typeface and not a
   fallback. The page frame itself is never mirrored — the design is built
   left-to-right and flipping it wholesale is what usually ruins these. */
(function () {
  'use strict';

  var HE = {
    // hero
    '3 founding places left · −25%': 'נותרו 3 מקומות בהנחה של 25%',
    'ads · brand films': 'פרסומות · סרטים',
    'identity · logo': 'זהות · לוגו',
    'built in minutes': 'מוכן תוך דקות',
    // app without the store
    App: 'אפליקציה',
    'no store, on the phone': 'בלי חנות, על הטלפון',
    'Your site, on the home screen.': 'האתר שלכם, על מסך הבית.',
    'No App Store. No Google Play. No approvals.': 'בלי App Store, בלי Google Play, בלי אישורים.',
    'Installs in one tap': 'מותקן בלחיצה אחת',
    'Opens full screen, with no address bar': 'נפתח במסך מלא, בלי שורת כתובת',
    'Works with no signal': 'עובד גם בלי קליטה',
    'Messages straight to the phone, no saved number needed': 'הודעות ישר לטלפון, בלי שיצטרכו לשמור את המספר',
    // notification buttons (push.js)
    'Turn on notifications': 'להפעיל התראות',
    'Send me a test notification': 'שלחו לי התראת ניסיון',
    'Notifications blocked': 'ההתראות חסומות',
    'Turn them back on in the browser settings for this site.': 'אפשר להחזיר אותן בהגדרות הדפדפן של האתר.',
    'This phone is subscribed.': 'הטלפון הזה רשום להתראות.',
    'One moment...': 'רגע אחד...',
    'Did not work. Try again.': 'זה לא עבד. נסו שוב.',
    'Not allowed, so nothing will arrive.': 'לא אישרתם, אז לא יגיעו התראות.',
    'Done. Now send yourself a test.': 'מוכן. עכשיו שלחו לעצמכם התראת ניסיון.',
    'Sent. It lands in a second or two.': 'נשלח. ההתראה תגיע תוך שנייה או שתיים.',
    'Install this site and see': 'התקינו את האתר הזה ותראו',
    'Tap Share, then Add to Home Screen': 'הקישו שיתוף, ואז הוספה למסך הבית',
    'Already on your home screen.': 'כבר על מסך הבית שלכם.',
    'Your browser offers it at the top of the page.': 'הדפדפן מציע את זה בראש העמוד.',
    'this very site installs,': 'האתר הזה עצמו מותקן, ',
    'try it now': 'נסו עכשיו',
    'send your site address, free check, answer in 24 hours': 'שלחו כתובת אתר, בדיקה בחינם, תשובה תוך 24 שעות',
    'Living art · loops': 'אמנות חיה · לופים',
    'A painting, a poster or a photograph set in motion and left to loop on a screen: a shop wall, a lobby, a restaurant, a room at home. Tap any of the four to watch it full size.': 'ציור, כרזה או צילום שמוזזים ורצים בלופ על מסך: קיר בחנות, לובי, מסעדה, חדר בבית. הקישו על אחת מהארבע כדי לראות במסך מלא.',
    'Order live art →': 'להזמין אמנות חיה →',
    'art that moves': 'אמנות שזזה',
    'films and living art': 'סרטים ואמנות חיה',
    'drag to spin, the front one': 'גררו לסיבוב, זה שמלפנים',
    'plays live': 'מתנגן חי',
    'pick a look, answer a short brief, get a price': 'בוחרים סגנון, עונים על בריף קצר, מקבלים מחיר',
    'type your brand name': 'הקלידו את שם המותג שלכם',
    '12 concepts,': '12 קונספטים, ',
    'each its own world': 'כל אחד עולם משלו',
    'type a name, pick a concept, we make it real': 'כותבים שם, בוחרים קונספט, ואנחנו מביאים אותו למציאות',
    '12 live templates,': '12 תבניות חיות, ',
    'each one different': 'כל אחת שונה',
    'pick a template, live in minutes': 'בוחרים תבנית, ועולים לאוויר תוך דקות',
    Showreel: 'שוריל',
    Product: 'מוצר',
    Motion: 'אנימציה',
    'Art, AI only': 'אמנות, AI בלבד',
    'Live + AI': 'צילום חי + AI',
    'Vertical hook': 'הוק אנכי',
    'Brand film': 'סרט מותג',
    Concept: 'קונספט',
    'Time lapse': 'טיים לאפס',
    live: 'חי',
    'Sound on': 'הפעלת קול',

    // founder
    'Founder, GenVidPro · Tel Aviv, Israel': 'מייסד, GenVidPro · תל אביב, ישראל',
    'I build video, brands and sites with AI. One person, a small studio, and a lot of takes until it looks right.':
      'אני בונה וידאו, מותגים ואתרים עם בינה מלאכותית. אדם אחד, סטודיו קטן, והרבה טייקים עד שזה נראה נכון.',

    // five stages
    'We take the product apart: who it is for, what it replaces, what makes someone choose it. You get the offer, the messages and the price story in writing — the spine everything else hangs on.':
      'אנחנו מפרקים את המוצר לגורמים: למי הוא מיועד, את מה הוא מחליף, ומה גורם לאדם לבחור בו. אתם מקבלים בכתב את ההצעה, המסרים וסיפור המחיר — עמוד השדרה שעליו נתלה כל השאר.',
    'Name direction, logo, colour, type, packaging and social templates — a small, sharp identity kit you can hand to anyone, plus your logo animated for every intro and end card.':
      'כיוון לשם, לוגו, צבע, טיפוגרפיה, אריזה ותבניות לרשתות — ערכת זהות קטנה וחדה שאפשר למסור לכל אחד, ובנוסף הלוגו שלכם מונפש לכל פתיח וסיומת.',
    'The campaign concept, the hook, the scripts and the storyboard — designed so the same idea works as a 60-second film, a 15-second scroll-stopper and a still.':
      'קונספט הקמפיין, ההוק, התסריטים והסטוריבורד — בנויים כך שאותו רעיון עובד כסרט של 60 שניות, כעצירת גלילה של 15 שניות וכתמונה בודדת.',
    'Brand films, product spots and logo animation, generated and directed frame by frame, with sound design, voice-over and grade. First cut in 48 hours, 4K master in days.':
      'סרטי מותג, ספוטים למוצר והנפשת לוגו, שנוצרים ומבוימים פריים אחר פריים, עם עיצוב סאונד, קריינות וקולור. עריכה ראשונה תוך 48 שעות, מאסטר 4K תוך ימים.',
    'Vertical, square and feed versions, subtitles and language swaps, thumbnails and variants for A/B testing — with titles on a separate layer so a price or slogan changes in minutes.':
      'גרסאות אנכיות, מרובעות ולפיד, כתוביות והחלפת שפות, תמונות ממוזערות וּוריאציות לבדיקות A/B — עם הכיתובים בשכבה נפרדת, כך שמחיר או סלוגן משתנים תוך דקות.',

    // founding offer
    'The studio is new. The first three brands pay 25% less.':
      'הסטודיו חדש. שלושת המותגים הראשונים משלמים 25% פחות.',
    'In return we ask for two things: an honest review when the work is live, and the right to show your brand in our portfolio. Same fixed price, same two revision rounds, same deadline. Three places, first come first served.':
      'בתמורה אנחנו מבקשים שני דברים: ביקורת כנה כשהעבודה עולה לאוויר, והזכות להציג את המותג שלכם בתיק העבודות. אותו מחיר קבוע, אותם שני סבבי תיקונים, אותו לוח זמנים. שלושה מקומות, כל הקודם זוכה.',
    'Build a brand': 'לבנות מותג',
    'Order a video': 'להזמין וידאו',
    'Build your own site, free': 'לבנות אתר בעצמכם, בחינם',
    'it plays like a game': 'זה עובד כמו משחק',

    // the site is only the start
    'A page that just sits there is a business card. These are the parts that make it work while you are cutting hair, cooking, driving or asleep. One setup, then a small monthly to keep it alive.':
      'עמוד שסתם יושב לו הוא כרטיס ביקור. אלה החלקים שגורמים לו לעבוד בזמן שאתם מסתפרים, מבשלים, נוהגים או ישנים. הקמה אחת, ואחריה תשלום חודשי קטן שישאיר אותו חי.',
    'Twelve looks, your name, your colour. Take the HTML and go. No account, no email.':
      'שנים־עשר סגנונות, השם שלכם, הצבע שלכם. לוקחים את קובץ ה־HTML והולכים. בלי חשבון, בלי אימייל.',
    'Written, designed, on your own domain, fast, and installable as an app from day one. That last part is PWA: your icon on the home screen, opens full screen, still opens with no signal. No App Store, no review, no yearly fee. Every button drops the lead into your WhatsApp, Telegram and email.':
      'כתוב, מעוצב, על הדומיין שלכם, מהיר, וניתן להתקנה כאפליקציה מהיום הראשון. החלק האחרון הוא PWA: אייקון במסך הבית, נפתח במסך מלא, ונפתח גם בלי קליטה. בלי חנות אפליקציות, בלי אישור, בלי דמי שנה. כל כפתור מפיל את הליד לוואטסאפ, לטלגרם ולאימייל שלכם.',
    'People ask about price or hours, by voice or by typing, in their own language. It answers and sends you the name and the number.':
      'אנשים שואלים על מחיר או שעות, בדיבור או בהקלדה, בשפה שלהם. הוא עונה ושולח לכם את השם ואת מספר הטלפון.',
    'Takes bookings, answers the same five questions people always ask, reminds them the day before, hands you the rest.':
      'קובע תורים, עונה על אותן חמש שאלות שתמיד שואלים, מזכיר יום לפני, ומעביר אליכם את השאר.',
    'Web AR. Your customer points the phone at the wall and the fridge, the sofa or the washing machine stands there at real size. Nothing to install. It answers the one question that stops the sale: will it fit.':
      'מציאות רבודה בדפדפן. הלקוח מכוון את הטלפון אל הקיר, והמקרר, הספה או המכונה עומדים שם בגודל אמיתי. אין מה להתקין. זה עונה על השאלה האחת שעוצרת מכירה: האם זה ייכנס.',
    'You get a code word. Type it on your own page and the prices and the hours become editable, right there. Bigger things, a new address or a new section, stay with us.':
      'אתם מקבלים מילת קוד. מקלידים אותה בעמוד שלכם והמחירים והשעות הופכים לניתנים לעריכה, במקום. דברים גדולים יותר, כתובת חדשה או מדור חדש, נשארים אצלנו.',
    'Who came, what they played, which button they pressed, where they left. One short report a month, in words, not charts you have to decode.':
      'מי נכנס, מה הוא ניגן, על איזה כפתור לחץ, ואיפה עזב. דוח קצר אחד בחודש, במילים, לא בגרפים שצריך לפענח.',
    'Ten seconds of your place, your hands, your product. Cut for the page and for reels.':
      'עשר שניות של המקום שלכם, הידיים שלכם, המוצר שלכם. ערוך לעמוד ולריאלס.',
    'Hosting, domain renewal, backups, we watch that it stays up. Two text or photo changes a month, you send them on WhatsApp.':
      'אחסון, חידוש דומיין, גיבויים, ואנחנו שומרים שהאתר יישאר באוויר. שני שינויי טקסט או תמונה בחודש, שולחים אותם בוואטסאפ.',
    'Care, plus the assistant answering on the page and every lead pushed to WhatsApp, Telegram and email. Five changes a month.':
      'כל מה שב־Care, ובנוסף העוזר שעונה בעמוד וכל ליד שנדחף לוואטסאפ, לטלגרם ולאימייל. חמישה שינויים בחודש.',
    'Connected, plus the monthly numbers and one change to the page because of them. First month free.':
      'כל מה שב־Connected, ובנוסף הנתונים החודשיים ושינוי אחד בעמוד בעקבותיהם. החודש הראשון חינם.',
    'Cancel any month. The site and the files stay yours either way. US studios charge $5,000 and up for the same package, and $75 to $150 a month to keep it.':
      'אפשר לבטל בכל חודש. האתר והקבצים נשארים שלכם כך או כך. סטודיו אמריקאי גובה 5,000 דולר ומעלה על אותה חבילה, ועוד 75 עד 150 דולר בחודש כדי לתחזק אותה.',
    'Ask for a discount': 'לבקש הנחה',

    // order — starting point
    'Just a product': 'רק מוצר',
    'No brand, no idea how to sell it yet': 'אין מותג, ועדיין אין מושג איך למכור אותו',
    'Brand, no campaign': 'יש מותג, אין קמפיין',
    'The look exists, the ads do not': 'המראה קיים, הפרסומות לא',
    'One piece only': 'פריט אחד בלבד',
    'You know exactly what you need': 'אתם יודעים בדיוק מה צריך',

    // modules
    '01 - Positioning & offer': '01 - מיצוב והצעה',
    'Audience, offer, messages and price story, in writing': 'קהל, הצעה, מסרים וסיפור מחיר, בכתב',
    '02 - Brand identity kit': '02 - ערכת זהות מותג',
    'Logo, colour, type, social templates, guidelines, source files': 'לוגו, צבע, טיפוגרפיה, תבניות לרשתות, קווים מנחים וקבצי מקור',
    '02 - Logo animation': '02 - הנפשת לוגו',
    'Intro, loop and vertical versions of your mark': 'גרסת פתיח, לופ ואנכית לסמל שלכם',
    '03 - Campaign concept & scripts': '03 - קונספט קמפיין ותסריטים',
    'The idea, the hook, scripts and storyboard': 'הרעיון, ההוק, התסריטים והסטוריבורד',
    '04 - Brand film, 30 sec': '04 - סרט מותג, 30 שניות',
    'Cinematic spot with sound design, voice-over and grade': 'ספוט קולנועי עם עיצוב סאונד, קריינות וקולור',
    '04 - Single spot, 15–30 sec': '04 - ספוט בודד, 15–30 שניות',
    'One product or brand video, vertical or wide, sound and titles included': 'סרטון מוצר או מותג אחד, אנכי או רחב, כולל סאונד וכיתובים',
    '04 - Product ads, 3 x 15 sec': '04 - פרסומות מוצר, 3 × 15 שניות',
    'Three variants built for the feed and A/B testing': 'שלוש וריאציות בנויות לפיד ולבדיקות A/B',
    '05 - Platform cuts & captions': '05 - גרסאות לפלטפורמות וכתוביות',
    '9:16, 1:1, subtitles, thumbnails and title layers': '9:16, 1:1, כתוביות, תמונות ממוזערות ושכבות כיתוב',
    '06 - Website, built and live': '06 - אתר, בנוי ובאוויר',
    'Written, designed, your own domain, fast, installable as an app, leads into WhatsApp': 'כתוב, מעוצב, על הדומיין שלכם, מהיר, ניתן להתקנה כאפליקציה, והלידים נכנסים לוואטסאפ',
    '06 - Assistant that talks': '06 - עוזר שמדבר',
    'Answers price and hours by voice or text, sends you the lead': 'עונה על מחיר ושעות בקול או בטקסט, ושולח לכם את הליד',
    '06 - Telegram and WhatsApp bot': '06 - בוט לטלגרם ולוואטסאפ',
    'Takes bookings, answers the usual questions, reminds the day before': 'קובע תורים, עונה על השאלות הרגילות, ומזכיר יום לפני',
    '06 - See it in your room (web AR)': '06 - לראות את זה בחדר שלכם (AR בדפדפן)',
    'Your product at real size in their room, no app. Plus $180 per product': 'המוצר שלכם בגודל אמיתי בחדר שלהם, בלי אפליקציה. בתוספת 180 דולר למוצר',
    '06 - Change it yourself': '06 - לשנות בעצמכם',
    'A code word on your own page unlocks prices and hours for editing': 'מילת קוד בעמוד שלכם פותחת את המחירים והשעות לעריכה',
    '06 - Numbers you can act on': '06 - נתונים שאפשר לפעול לפיהם',
    'Who came, what they clicked, where they left — one report a month, in words': 'מי נכנס, על מה לחץ, ואיפה עזב — דוח אחד בחודש, במילים',

    // add-ons and plans
    'Extra language': 'שפה נוספת',
    'Second language track or subtitles': 'פסקול או כתוביות בשפה שנייה',
    'Paid-ads licence, 30 days': 'רישיון לפרסום ממומן, 30 יום',
    'Unlimited paid distribution for a month': 'הפצה ממומנת ללא הגבלה למשך חודש',
    'Extra revision round': 'סבב תיקונים נוסף',
    'One more pass beyond the two included': 'סבב אחד מעבר לשניים הכלולים',
    'Rush delivery': 'מסירה דחופה',
    'Everything moves to the front of the queue': 'הכול עובר לראש התור',
    'Care — care plan': 'Care — תוכנית תחזוקה',
    'Hosting, domain, backups, uptime, two changes a month': 'אחסון, דומיין, גיבויים, זמינות, ושני שינויים בחודש',
    'Connected — care plan': 'Connected — תוכנית תחזוקה',
    'Care plus the assistant and leads pushed to WhatsApp, Telegram and email': 'כל מה שב־Care ובנוסף העוזר והלידים שנדחפים לוואטסאפ, לטלגרם ולאימייל',
    'Growth — care plan': 'Growth — תוכנית תחזוקה',
    'Connected plus monthly numbers and one change made from them — first month free': 'כל מה שב־Connected ובנוסף נתונים חודשיים ושינוי אחד שנעשה בעקבותיהם — החודש הראשון חינם',

    // brief
    'Your brief — five questions, the rest optional': 'הבריף שלכם — חמש שאלות, השאר לבחירה',
    'Five required questions first, forty-five optional ones below them. Tap to choose, type where a line is offered.':
      'קודם חמש שאלות חובה, ומתחתיהן ארבעים וחמש לבחירה. מקישים כדי לבחור, ומקלידים היכן שיש שורה.',
    'Required · 5 questions': 'חובה · 5 שאלות',
    '45 optional questions': '45 שאלות לבחירה',
    'help us land closer': 'עוזרות לנו לקלוע מדויק יותר',
    'Your name': 'השם שלכם',
    'Email or WhatsApp number': 'אימייל או מספר וואטסאפ',
    'What do you sell, in one line': 'מה אתם מוכרים, בשורה אחת',
    'What should the work do first': 'מה העבודה צריכה לעשות קודם כול',
    'Sell now': 'למכור עכשיו',
    'Launch a new product': 'להשיק מוצר חדש',
    'Explain how it works': 'להסביר איך זה עובד',
    'Build trust': 'לבנות אמון',
    'Recruit or investors': 'גיוס עובדים או משקיעים',
    'Deadline or launch date': 'תאריך יעד או מועד השקה',
    'Company or brand name': 'שם החברה או המותג',
    'Website or Instagram': 'אתר או אינסטגרם',
    'Country and language of your customers': 'המדינה והשפה של הלקוחות שלכם',
    'How long has the business existed': 'כמה זמן העסק קיים',
    'Not launched yet': 'עדיין לא הושק',
    'Under a year': 'פחות משנה',
    '1–3 years': '1–3 שנים',
    '3+ years': '3 שנים ומעלה',
    'Price range of the product': 'טווח המחירים של המוצר',
    'Under $30': 'עד 30 דולר',
    Subscription: 'מנוי',
    'Physical product, digital or service': 'מוצר פיזי, דיגיטלי או שירות',
    Physical: 'פיזי',
    Digital: 'דיגיטלי',
    Service: 'שירות',
    'App / SaaS': 'אפליקציה / SaaS',
    Course: 'קורס',
    'The one thing that makes it better than the alternatives': 'הדבר האחד שעושה אותו טוב יותר מהחלופות',
    'Your three closest competitors, names or links': 'שלושת המתחרים הקרובים ביותר, שמות או קישורים',
    'Three words customers use when they praise it': 'שלוש מילים שלקוחות אומרים כשהם משבחים אותו',
    'Can you ship us the product or send photos': 'תוכלו לשלוח לנו את המוצר או תמונות שלו',
    'Ship a sample': 'לשלוח דוגמה',
    'Send photos': 'לשלוח תמונות',
    'Renders only': 'רנדרים בלבד',
    'Nothing yet': 'עדיין כלום',
    'Age of your typical buyer': 'גיל הקונה הטיפוסי שלכם',
    Mixed: 'מעורב',
    'Gender balance': 'חלוקה מגדרית',
    'Mostly women': 'בעיקר נשים',
    'Mostly men': 'בעיקר גברים',
    Even: 'שווה',
    'What problem they have before finding you': 'איזו בעיה יש להם לפני שהם מוצאים אתכם',
    'What stops them from buying today': 'מה עוצר אותם מלקנות היום',
    'Where they spend time online': 'איפה הם מבלים ברשת',
    'Google search': 'חיפוש בגוגל',
    'B2C, B2B or both': 'B2C, B2B או שניהם',
    Both: 'שניהם',
    'How you will measure success': 'איך תמדדו הצלחה',
    Sales: 'מכירות',
    Leads: 'לידים',
    'Views and reach': 'צפיות וחשיפה',
    Followers: 'עוקבים',
    'Brand feel': 'תחושת מותג',
    'Where the videos will run': 'איפה הסרטונים ירוצו',
    'Instagram / Reels': 'אינסטגרם / ריאלס',
    'Meta ads': 'פרסום במטא',
    'Google / YouTube ads': 'פרסום בגוגל / יוטיוב',
    Website: 'אתר',
    'Amazon listing': 'דף מוצר באמזון',
    'TV / events': 'טלוויזיה / אירועים',
    'Formats you need': 'הפורמטים שאתם צריכים',
    '9:16 vertical': '9:16 אנכי',
    '16:9 wide': '16:9 רחב',
    '1:1 square': '1:1 מרובע',
    '4:5 feed': '4:5 לפיד',
    'Lengths you need': 'האורכים שאתם צריכים',
    '6 s bumper': 'באמפר של 6 שניות',
    '2–3 min': '2–3 דקות',
    'Paid ads or organic posting': 'פרסום ממומן או פרסום אורגני',
    'Paid ads': 'ממומן',
    Organic: 'אורגני',
    'What you already have': 'מה כבר יש לכם',
    Logo: 'לוגו',
    'Brand book': 'ספר מותג',
    'Colours and fonts': 'צבעים וגופנים',
    'Product photos': 'תמונות מוצר',
    'Existing videos': 'סרטונים קיימים',
    'Keep the current look or start fresh': 'לשמור על המראה הנוכחי או להתחיל מחדש',
    'Keep it': 'לשמור',
    'Refresh it': 'לרענן',
    'Start fresh': 'להתחיל מחדש',
    'Not sure': 'לא בטוח',
    'Brand personality in three words': 'אופי המותג בשלוש מילים',
    'Tone you want': 'הטון שאתם רוצים',
    'Premium and calm': 'יוקרתי ורגוע',
    'Bold and loud': 'נועז ורועש',
    'Warm and friendly': 'חם וידידותי',
    'Tech and precise': 'טכנולוגי ומדויק',
    Playful: 'שובב',
    Luxury: 'לוקסוס',
    Minimal: 'מינימלי',
    'Colours you love or must keep': 'צבעים שאתם אוהבים או חייבים לשמור',
    'Colours or styles to avoid': 'צבעים או סגנונות שיש להימנע מהם',
    'Link to a video you wish was yours, and why': 'קישור לסרטון שהייתם רוצים שיהיה שלכם, ולמה',
    'A second reference, video or brand': 'רפרנס שני, סרטון או מותג',
    'A brand whose style you dislike, and why': 'מותג שהסגנון שלו לא מוצא חן בעיניכם, ולמה',
    'Real people on camera or product only': 'אנשים אמיתיים במצלמה או מוצר בלבד',
    'Product only': 'מוצר בלבד',
    'Hands and details': 'ידיים ופרטים',
    'A presenter': 'מגיש',
    'Lifestyle scenes': 'סצנות לייף־סטייל',
    Animated: 'מונפש',
    'Music feel': 'תחושת המוזיקה',
    Cinematic: 'קולנועי',
    Electronic: 'אלקטרוני',
    'Warm acoustic': 'אקוסטי חם',
    'Upbeat pop': 'פופ קצבי',
    'Silent, sound design only': 'ללא מוזיקה, עיצוב סאונד בלבד',
    'You choose': 'אתם תבחרו',
    'Voice-over': 'קריינות',
    Male: 'גבר',
    Female: 'אישה',
    'No voice, titles only': 'בלי קול, כיתובים בלבד',
    'Languages for voice and subtitles': 'שפות לקריינות ולכתוביות',
    'The one message the viewer must remember': 'המסר האחד שהצופה חייב לזכור',
    'Call to action at the end': 'קריאה לפעולה בסוף',
    'Shop now': 'לקנות עכשיו',
    'Visit the site': 'להיכנס לאתר',
    'Follow us': 'לעקוב אחרינו',
    'Book a call': 'לקבוע שיחה',
    'Download the app': 'להוריד את האפליקציה',
    'Pre-order': 'הזמנה מוקדמת',
    'Offer, price or promo code to show': 'הצעה, מחיר או קוד קופון להצגה',
    'Legal lines or claims we must include or avoid': 'שורות משפטיות או טענות שחובה לכלול או להימנע מהן',
    'Product features that must be seen on screen': 'תכונות מוצר שחייבות להיראות על המסך',
    'Anything that must never appear': 'משהו שאסור שיופיע לעולם',
    'Who approves the work on your side': 'מי מאשר את העבודה מצדכם',
    'Just me': 'רק אני',
    'Me and a partner': 'אני ושותף',
    'A team': 'צוות',
    'How fast you can give feedback': 'כמה מהר תוכלו לתת משוב',
    'Same day': 'באותו יום',
    'Within 2 days': 'תוך יומיים',
    'Within a week': 'תוך שבוע',
    'Preferred channel': 'ערוץ מועדף',
    Email: 'אימייל',
    'Video call': 'שיחת וידאו',
    'How you found us': 'איך מצאתם אותנו',
    Referral: 'המלצה',
    Other: 'אחר',
    'Anything else we should know': 'עוד משהו שכדאי שנדע',

    // order footer
    'Nothing here is binding. We read the brief, reply within one working day with a written plan, and only then you decide.':
      'שום דבר כאן אינו מחייב. אנחנו קוראים את הבריף, חוזרים תוך יום עסקים אחד עם תוכנית כתובה, ורק אז אתם מחליטים.',
    'Start with step 01, where are you now': 'מתחילים בשלב 01, איפה אתם עכשיו',
    '50% to start, 50% on delivery.': '50% בהתחלה, 50% במסירה.',
    'Send the brief by email': 'לשלוח את הבריף באימייל',
    'Send it on WhatsApp': 'לשלוח בוואטסאפ',
    'Gift with every order:': 'מתנה לכל הזמנה:',
    'a vertical 9:16 cut of your main video, free. Worth $300.': 'גרסה אנכית 9:16 של הסרטון הראשי שלכם, חינם. שווי 300 דולר.',
    'Review & send': 'לבדוק ולשלוח',

    // faq
    'Frequently asked questions': 'שאלות נפוצות',
    'I only have a product and no idea how to sell it. Is that enough?': 'יש לי רק מוצר ואין לי מושג איך למכור אותו. זה מספיק?',
    'That is the normal starting point here. Stage 01 turns the product into an offer — who it is for, what it replaces, why it is worth the price — and everything after is built on it.':
      'זו נקודת הפתיחה הרגילה כאן. שלב 01 הופך את המוצר להצעה — למי הוא מיועד, את מה הוא מחליף, ולמה הוא שווה את המחיר — וכל מה שבא אחריו נבנה עליה.',
    'Why one studio instead of an agency, a designer and a film crew?': 'למה סטודיו אחד ולא משרד פרסום, מעצב וצוות הפקה?',
    'Because the idea survives. The person who writes the positioning also directs the film and cuts the vertical version, so nothing is lost in three hand-offs — and it costs a fraction of four invoices.':
      'כי הרעיון שורד. מי שכותב את המיצוב גם מביים את הסרט וגם עורך את הגרסה האנכית, כך ששום דבר לא הולך לאיבוד בשלוש העברות — וזה עולה שבריר משמונה חשבוניות.',
    'Is this real production or stock footage?': 'זו הפקה אמיתית או צילומי סטוק?',
    'Every frame is generated and directed for your brief — no stock library, no template. The work above is the honest sample of what you get.':
      'כל פריים נוצר ומבוים לפי הבריף שלכם — בלי ספריית סטוק, בלי תבנית. העבודות שלמעלה הן הדוגמה הכנה למה שתקבלו.',
    'What if I do not like the first cut?': 'ומה אם העריכה הראשונה לא תמצא חן בעיניי?',
    'Two revision rounds sit inside every stage, and the first cut lands on day two precisely so a change of direction is cheap. If the concept is wrong at that point, you pay the deposit only and we stop.':
      'שני סבבי תיקונים כלולים בכל שלב, והעריכה הראשונה מגיעה כבר ביום השני בדיוק כדי ששינוי כיוון יהיה זול. אם הקונספט שגוי בנקודה הזו, אתם משלמים רק את המקדמה ואנחנו עוצרים.',
    'Who owns the brand and the videos?': 'למי שייכים המותג והסרטונים?',
    'You do. Full rights and the source files are included in the identity stage and available as an add-on for video.':
      'לכם. מלוא הזכויות וקבצי המקור כלולים בשלב הזהות, וזמינים כתוספת עבור הווידאו.',
    'How do I pay, and how fast is it?': 'איך משלמים, וכמה מהר זה?',
    '50% to begin, 50% on delivery. The deposit button opens PayPal with the exact amount already filled in — card or PayPal balance, no account needed to pay. Bank transfer and an invoice are available too. A single video takes 3–7 days; a full brand-to-launch package runs three to five weeks.':
      '50% בהתחלה, 50% במסירה. כפתור המקדמה פותח את פייפאל עם הסכום המדויק כבר ממולא — בכרטיס או ביתרת פייפאל, בלי צורך בחשבון כדי לשלם. אפשר גם העברה בנקאית וחשבונית. סרטון בודד לוקח 3–7 ימים; חבילה מלאה ממותג ועד השקה נמשכת שלושה עד חמישה שבועות.',

    // misc
    Terms: 'תנאים',
    Privacy: 'פרטיות',
    'Close ✕': 'סגירה ✕',
    Install: 'התקנה',
    'Type here': 'כתבו כאן',

    // builder page
    'free site builder': 'בונה אתרים חינמי',
    'Pick a look, type your name, move the colour. What you see is the real page, live, not a picture of one.':
      'בוחרים מראה, מקלידים את השם, מזיזים את הצבע. מה שאתם רואים הוא העמוד האמיתי, חי, ולא תמונה שלו.',
    'Twelve looks for a barbershop. Tap one to load it below.': 'שנים־עשר מראות למספרה. הקישו על אחד כדי לטעון אותו למטה.',
    'Twelve looks for a dental clinic. Tap one to load it below.': 'שנים־עשר מראות למרפאת שיניים. הקישו על אחד כדי לטעון אותו למטה.',
    'Twelve looks for an electronics store. Tap one to load it below.': 'שנים־עשר מראות לחנות אלקטרוניקה. הקישו על אחד כדי לטעון אותו למטה.',
    'Twelve looks for a yoga studio. Tap one to load it below.': 'שנים־עשר מראות לסטודיו ליוגה. הקישו על אחד כדי לטעון אותו למטה.',
    'Twelve looks for a furniture store. Tap one to load it below.': 'שנים־עשר מראות לחנות רהיטים. הקישו על אחד כדי לטעון אותו למטה.',
    Barbershop: 'מספרה',
    'Dental clinic': 'מרפאת שיניים',
    'Electronics store': 'חנות אלקטרוניקה',
    'Yoga studio': 'סטודיו ליוגה',
    'Furniture store': 'חנות רהיטים',
    'Creative studio': 'סטודיו קריאייטיב',
    'by': ' מאת ',
    'live': 'חי',
    'live preview': 'תצוגה חיה',
    'drag to spin, the front one': 'גררו כדי לסובב, הקדמי ',
    'plays live': 'מתנגן חי',
    '12 live templates,': '12 תבניות חיות, ',
    'each one different': 'כל אחת שונה',
    '12 concepts,': '12 קונספטים, ',
    'each its own world': 'כל אחד עולם משלו',
    'ORDER LIVING ART': 'להזמין אמנות חיה ',
    'ORDER A LIVING PAINTING': 'להזמין ציור חי ',
    'ORDER YOUR VIDEO': 'להזמין וידאו ',
    'BUILD YOUR SITE, FREE': 'לבנות אתר, בחינם ',
    'BUILD YOUR BRAND, FREE': 'לבנות מותג, בחינם ',
    'BUILD IT AND INSTALL IT': 'לבנות ולהתקין ',
    'no app store': 'בלי חנות אפליקציות',
    'twelve templates, free, live in minutes, installs like an app': 'שתים עשרה תבניות, בחינם, באוויר תוך דקות, מותקן כמו אפליקציה',
    'No site yet? Build one free, in minutes →': 'עדיין אין אתר? בנו אחד בחינם, תוך דקות ←',
    // thanks and 404
    'Deposit received': 'המקדמה התקבלה',
    'Thank you. Your project is booked. You will get the written plan — stages, dates and the first concept — within one working day, at the contact you left with the order.':
      'תודה. הפרויקט שלכם נקבע. תוך יום עסקים אחד תקבלו תוכנית כתובה, שלבים, תאריכים והקונספט הראשון, באמצעי הקשר שהשארתם בהזמנה.',
    'Back to GenVidPro': 'חזרה ל-GenVidPro',
    'Error 404 — nothing at this address': 'שגיאה 404, אין כלום בכתובת הזו',
    'This frame does not exist': 'הפריים הזה לא קיים',
    'The page you asked for was moved or never made. The work, the prices and the order form all live on the front page.':
      'העמוד שביקשתם הועבר או שמעולם לא נוצר. העבודות, המחירים וטופס ההזמנה נמצאים כולם בעמוד הראשי.',
    'See the work': 'לראות את העבודות',
    'your picture or a public-domain painting · Full HD, 4K on request · quote in 24 hours': 'התמונה שלכם או ציור מנחלת הכלל · Full HD, 4K לפי בקשה · הצעת מחיר תוך 24 שעות',
    'pick a look, answer a short brief, get a price': 'בוחרים מראה, עונים על בריף קצר, מקבלים מחיר',
    'pick a template, live in minutes': 'בוחרים תבנית, באוויר תוך דקות',
    'type a name, pick a concept, we make it real': 'מקלידים שם, בוחרים קונספט, אנחנו מגשימים',
    'split hero': 'פתיח מפוצל',
    'ticket price list': 'מחירון כמו כרטיס',
    'quiet, serif': 'שקט, סריף',
    'card grid': 'רשת כרטיסים',
    'sign and ticker': 'שלט ושורה רצה',
    'sign + ticker': 'שלט + שורה רצה',
    'name fills the page': 'השם ממלא את הדף',
    'photocopy, taped': 'צילום מכונה, מודבק',
    'magazine index': 'תוכן של מגזין',
    'booking first': 'קודם כל הזמנה',
    'colour stripes': 'פסי צבע',
    'color stripes': 'פסי צבע',
    'all monospace': 'הכול בגופן קבוע',
    'gold, framed': 'זהב, במסגרת',
    'Terms': 'תנאים',
    'Privacy': 'פרטיות',
    'Tel Aviv, Israel': 'תל אביב, ישראל',
    '· Tel Aviv, Israel': '· תל אביב, ישראל',
    'Close ✕': 'סגור ✕',
    'TAP TO ADD OR REMOVE': 'לחצו כדי להוסיף או להסיר',
    'Tap to add or remove': 'לחצו כדי להוסיף או להסיר',
    '— tap to add or remove': '— לחצו כדי להוסיף או להסיר',
    'What we build — tap to add or remove': 'מה אנחנו בונים — לחצו כדי להוסיף או להסיר',
    'Keep it alive — monthly, cancel any month': 'להשאיר בחיים — חודשי, אפשר לבטל בכל חודש',
    'MONTHLY, CANCEL ANY MONTH': 'חודשי, אפשר לבטל בכל חודש',
    'Connected': 'מחובר',
    'Connected — care plan': 'מחובר — תוכנית ליווי',
    'Make your own': 'בנו לעצמכם',
    'business site': 'אתר לעסק',
    'category': 'קטגוריה',
    'look': 'מראה',
    'your brand': 'המותג שלכם',
    'take it': 'קחו אותו',
    '← genvidpro.com': '← genvidpro.com',
    'A painting that moves and loops on a screen: a gallery, a lobby, a restaurant, a shop, a room at home. Pick a work that is free to animate or send your own, and we come back with a quote within 24 hours.': 'ציור שזז ורץ בלופ על מסך: גלריה, לובי, מסעדה, חנות, חדר בבית. בחרו יצירה שמותר להנפיש או שלחו משלכם, ונחזור עם הצעת מחיר תוך 24 שעות.',
    'Not only paintings — a timelapse, a story, a brand film, or a living person put into any world. SHELTER, MOLT and Robert’s Worlds were made the same way.': 'לא רק ציורים — טיים-לאפס, סיפור, סרט מותג, או אדם חי שמוכנס לכל עולם. SHELTER, MOLT ו-Robert’s Worlds נעשו בדיוק כך.',
    'What we animate': 'מה מנפישים',
    'Find a work': 'למצוא יצירה',
    'Upload your own': 'להעלות משלכם',
    'Search': 'חיפוש',
    'Search by artist or title': 'חיפוש לפי אמן או שם היצירה',
    'Only works already free to use are shown — The Met and Wikimedia Commons': 'מוצגות רק יצירות שכבר מותר להשתמש בהן — The Met ו-Wikimedia Commons',
    'Ordering a timelapse, a story or a brand film instead? Skip this step and go straight to': 'מזמינים טיים-לאפס, סיפור או סרט מותג? דלגו על השלב הזה ועברו ישר ל-',
    'This work may still be under copyright, so we cannot animate it. Try another artist, or upload your own image below.': 'ייתכן שהיצירה הזאת עדיין מוגנת בזכויות יוצרים, ולכן לא נוכל להנפיש אותה. נסו אמן אחר, או העלו תמונה משלכם למטה.',
    'Search is temporarily unavailable, please upload your image instead.': 'החיפוש לא זמין כרגע, העלו בבקשה תמונה משלכם.',
    'Upload your own image': 'להעלות תמונה משלכם',
    'Load more': 'להציג עוד',
    'Loading…': 'טוען…',
    'Drop your image here': 'גררו לכאן את התמונה',
    'portrait, poster, photo, artwork, anything': 'דיוקן, כרזה, צילום, יצירה, כל דבר',
    'Choose a file': 'לבחור קובץ',
    'jpg or png, up to 25 MB': 'jpg או png, עד 25 MB',
    'I own this image or it is in the public domain.': 'התמונה שלי או שהיא בנחלת הכלל.',
    'We check every upload manually before production.': 'אנחנו בודקים ידנית כל קובץ לפני ההפקה.',
    'What we make': 'מה אנחנו עושים',
    'A painting brought to life': 'ציור שקם לחיים',
    'A still image, moving and looping': 'תמונה סטטית שזזה ורצה בלופ',
    'A timelapse': 'טיים-לאפס',
    'Growth, weather, a city, a build': 'צמיחה, מזג אוויר, עיר, בנייה',
    'A story or a fairy tale': 'סיפור או אגדה',
    'Characters and a plot, told in a minute': 'דמויות ועלילה, בדקה אחת',
    'A brand or concept film': 'סרט מותג או קונספט',
    'The way SHELTER and MOLT were made': 'כמו שנעשו SHELTER ו-MOLT',
    'A person in any world': 'אדם בכל עולם',
    'A real face put into any set — the way Robert’s Worlds was made': 'פנים אמיתיות בכל תפאורה — כמו שנעשה Robert’s Worlds',
    'Something else': 'משהו אחר',
    'Write it in the line below and we will say if we can': 'כתבו בשורה למטה ונגיד אם אפשר',
    'In one line: what happens on the screen?': 'בשורה אחת: מה קורה על המסך?',
    'The sea in the painting starts to move, gulls fly through': 'הים בציור מתחיל לזוז, שחפים חולפים',
    'How many pieces': 'כמה יצירות',
    'One artwork': 'יצירה אחת',
    '2 minute seamless loop': 'לופ חלק של 2 דקות',
    'from $1,800': 'מ-$1,800',
    'Series of 3': 'סדרה של 3',
    'Three works, one programme': 'שלוש יצירות, תוכנית אחת',
    'from $4,500 ($1,500 per work, save 17%)': 'מ-$4,500 ($1,500 ליצירה, חיסכון 17%)',
    'Series of 8': 'סדרה של 8',
    'The full set for a screen': 'הסט המלא למסך',
    'from $9,600 ($1,200 per work, save 33%)': 'מ-$9,600 ($1,200 ליצירה, חיסכון 33%)',
    'Formats': 'פורמטים',
    'Screens and TVs': 'מסכים וטלוויזיות',
    '9:16 vertical': '9:16 אנכי',
    'Phones, totems, reels': 'טלפונים, טוטמים, רילס',
    'Ultrawide': 'רחב במיוחד',
    'For an LED wall': 'לקיר LED',
    'Everything is delivered in': 'הכול נמסר ב-',
    '. For a large screen or an LED wall we master in 4K, and that is priced on top.': '. למסך גדול או לקיר LED אנחנו מפיקים ב-4K, וזה בתוספת מחיר.',
    '4K master': 'מאסטר 4K',
    'For big screens and LED walls': 'למסכים גדולים ולקירות LED',
    ', +30%': ', +30%',
    'Licence': 'רישיון',
    'Non-exclusive': 'לא בלעדי',
    'You use it, we can license the same work to others.': 'אתם משתמשים, ואנחנו יכולים לתת רישיון על אותה יצירה גם לאחרים.',
    'Included in the price above.': 'כלול במחיר שלמעלה.',
    'Exclusive': 'בלעדי',
    'We will not license this work to anyone else for the agreed term and territory.': 'לא ניתן רישיון על היצירה הזאת לאף אחד אחר לתקופה ולטריטוריה שסוכמו.',
    '×2.5': '×2.5',
    'We send a quote within 24 hours.': 'נשלח הצעת מחיר תוך 24 שעות.',
    'Final quote within 24 hours.': 'הצעת מחיר סופית תוך 24 שעות.',
    'Custom work — we price it after we understand the brief. Quote within 24 hours.': 'עבודה מותאמת — נתמחר אחרי שנבין את הבריף. הצעת מחיר תוך 24 שעות.',
    'Planning a full 30 minute programme for a venue? We price that separately.': 'מתכננים תוכנית מלאה של 30 דקות למקום? את זה אנחנו מתמחרים בנפרד.',
    'Where to send it': 'לאן לשלוח',
    'Name': 'שם',
    'Email': 'אימייל',
    'Company': 'חברה',
    '(optional)': '(לא חובה)',
    'Where will this be shown?': 'איפה זה יוצג?',
    'Venue, exhibition, screen, hotel': 'מקום, תערוכה, מסך, מלון',
    'Send request': 'לשלוח בקשה',
    'Sending…': 'שולח…',
    'Sent — we reply within one working day': 'נשלח. נחזור אליכם תוך יום עסקים אחד',
    'Name and email, please.': 'שם ואימייל, בבקשה.',
    'Pick a work above, or send your own picture.': 'בחרו יצירה למעלה, או שלחו תמונה משלכם.',
    'Write in one line what should happen on the screen.': 'כתבו בשורה אחת מה צריך לקרות על המסך.',
    'Tick the line saying the picture is yours or in the public domain.': 'סמנו שהתמונה שלכם או בנחלת הכלל.',
    'Could not send just now. Try again in a minute, or write to genvidpro@gmail.com': 'לא הצלחנו לשלוח כרגע. נסו שוב בעוד דקה, או כתבו ל-genvidpro@gmail.com',
    'Could not take that file. Try another one, or write to genvidpro@gmail.com': 'לא הצלחנו לקלוט את הקובץ. נסו קובץ אחר, או כתבו ל-genvidpro@gmail.com',
    'Only jpg or png, please.': 'רק jpg או png, בבקשה.',
    'That file is over 25 MB. Send a smaller copy.': 'הקובץ מעל 25 MB. שלחו עותק קטן יותר.',
    'Got it': 'קיבלנו',
    'We will come back within 24 hours.': 'נחזור אליכם תוך 24 שעות.',
    'Look closer': 'להתקרב',
    /* terms.html / privacy.html, 10 September 2026 */
    'Terms of Service': 'תנאי שירות',
    'Privacy Policy': 'מדיניות פרטיות',
    'Last updated 10 September 2026': 'עודכן לאחרונה 10 בספטמבר 2026',
    'These terms apply to every order placed with GenVidPro (Roman Chorny, Tel Aviv, Israel) through genvidpro.com, email or WhatsApp.': 'תנאים אלה חלים על כל הזמנה שנעשית אצל GenVidPro (Roman Chorny, Tel Aviv, Israel) דרך genvidpro.com, אימייל או WhatsApp.',
    '1. The offer': '1. ההצעה',
    'Prices shown on the site are starting prices in US dollars for the described scope. The final price depends on the brief and is confirmed in a written plan with stages and dates, sent before any payment. The plan is the contract.': 'המחירים באתר הם מחירי התחלה בדולר אמריקאי עבור היקף העבודה המתואר. המחיר הסופי תלוי בבריף ומאושר בתוכנית כתובה עם שלבים ותאריכים, שנשלחת לפני כל תשלום. התוכנית היא החוזה.',
    '2. Payment': '2. תשלום',
    '50% deposit to begin, 50% on delivery of the final files. Payment by PayPal, card through PayPal, or bank transfer. Work starts when the deposit arrives.': '50% מקדמה בתחילת העבודה, 50% במסירת הקבצים הסופיים. תשלום דרך PayPal, בכרטיס דרך PayPal או בהעברה בנקאית. העבודה מתחילה כשהמקדמה מתקבלת.',
    '3. Revisions': '3. תיקונים',
    'Two revision rounds are included in every stage. Further rounds are priced by agreement before they start. A change of concept after approval of the previous stage is a new order.': 'שני סבבי תיקונים כלולים בכל שלב. סבבים נוספים מתומחרים בהסכמה לפני תחילתם. שינוי קונספט אחרי אישור השלב הקודם הוא הזמנה חדשה.',
    '4. Cancellation': '4. ביטול',
    'You may stop after any stage. The deposit covers the work done to that point and is not refunded once production has started. If we cannot deliver, the unused part of the deposit is returned.': 'אפשר לעצור אחרי כל שלב. המקדמה מכסה את העבודה שנעשתה עד אותה נקודה ואינה מוחזרת ברגע שההפקה התחילה. אם אנחנו לא יכולים לספק, החלק שלא נוצל מהמקדמה מוחזר.',
    '5. Rights': '5. זכויות',
    'On full payment you own the delivered brand assets and videos for your own commercial use. Source files and unlimited paid-advertising rights are included where the order says so, otherwise available as add-ons. We may show the work in our portfolio unless you ask us not to in writing.': 'עם התשלום המלא, נכסי המותג והסרטונים שנמסרו שייכים לכם לשימוש מסחרי משלכם. קובצי מקור וזכויות פרסום ממומן ללא הגבלה כלולים במקום שבו ההזמנה אומרת זאת, ואחרת זמינים כתוספת. אנחנו רשאים להציג את העבודה בתיק העבודות שלנו אלא אם תבקשו בכתב שלא.',
    'Living Paintings are licensed, not sold. With a non-exclusive licence you may use the animation for your own purposes, and we may license the same work to others. With an exclusive licence we will not license this work to anyone else for the agreed term and territory. The licence starts on full payment.': 'Living Paintings ניתנות ברישיון, לא נמכרות. ברישיון לא בלעדי אתם משתמשים באנימציה למטרותיכם, ואנחנו רשאים להעניק רישיון לאותה עבודה לאחרים. ברישיון בלעדי לא נעניק רישיון לעבודה זו לאף אחד אחר לתקופה ולטריטוריה שסוכמו. הרישיון נכנס לתוקף עם התשלום המלא.',
    '6. Materials you provide': '6. חומרים שאתם מספקים',
    'You confirm you have the right to use every logo, photo, text and product you send us. AI-generated material is produced for your brief and checked by a human; it is not stock footage.': 'אתם מאשרים שיש לכם זכות להשתמש בכל לוגו, תמונה, טקסט ומוצר שאתם שולחים לנו. חומר שנוצר על ידי AI מופק לפי הבריף שלכם ונבדק על ידי אדם; זה לא צילומי סטוק.',
    '7. Liability': '7. אחריות',
    'Our liability is limited to the amount paid for the order. We do not guarantee sales results.': 'אחריותנו מוגבלת לסכום ששולם עבור ההזמנה. אנחנו לא מבטיחים תוצאות מכירה.',
    '8. Contact': '8. יצירת קשר',
    'GenVidPro collects only what is needed to answer your request and deliver the work.': 'GenVidPro אוספת רק את מה שנדרש כדי לענות לפנייתכם ולמסור את העבודה.',
    'What we collect': 'מה אנחנו אוספים',
    'Your name, company, email or WhatsApp number, links you share, the answers you give in the order brief, and the images you upload for Living Paintings. Payments are processed by PayPal; we never see your card details.': 'שמכם, החברה, אימייל או מספר WhatsApp, קישורים שאתם משתפים, התשובות בבריף ההזמנה והתמונות שאתם מעלים ל-Living Paintings. התשלומים מעובדים על ידי PayPal; אנחנו לעולם לא רואים את פרטי הכרטיס שלכם.',
    'Why': 'למה',
    'To reply to you, prepare the plan, produce the work and issue invoices. We do not sell or share your data with anyone except the services needed to deliver: email, PayPal and file storage.': 'כדי לענות לכם, להכין את התוכנית, להפיק את העבודה ולהוציא חשבוניות. אנחנו לא מוכרים ולא משתפים את הנתונים שלכם עם אף אחד מלבד השירותים הדרושים למסירה: אימייל, PayPal ואחסון קבצים.',
    'Storage': 'אחסון',
    'Briefs and files are kept in our email and Google Drive for the duration of the project and up to two years after, then deleted on request or by routine clean-up. Files uploaded through Living Paintings are stored on our server for up to 60 days, are reachable by their direct link, and are then deleted automatically. Uploads are limited to 12 files per address per day.': 'בריפים וקבצים נשמרים באימייל וב-Google Drive שלנו למשך הפרויקט ועד שנתיים אחריו, ואז נמחקים לפי בקשה או בניקוי שגרתי. קבצים שהועלו דרך Living Paintings נשמרים בשרת שלנו עד 60 יום, נגישים בקישור ישיר, ואז נמחקים אוטומטית. ההעלאות מוגבלות ל-12 קבצים לכתובת ביום.',
    'Cookies and analytics': 'עוגיות ואנליטיקה',
    'The site uses no tracking cookies and no third-party analytics.': 'האתר לא משתמש בעוגיות מעקב ולא באנליטיקה של צד שלישי.',
    'Your rights': 'הזכויות שלכם',
    'Ask us at any time to see, correct or delete what we hold about you: genvidpro@gmail.com.': 'בקשו מאיתנו בכל עת לראות, לתקן או למחוק את מה שאנחנו מחזיקים עליכם: genvidpro@gmail.com.',
  };

  var RU = {
    '3 founding places left · −25%': 'осталось 3 места со скидкой 25%',
    'ads · brand films': 'реклама · фильмы',
    'identity · logo': 'айдентика · лого',
    'built in minutes': 'готов за минуты',
    // app without the store
    App: 'Приложение',
    'no store, on the phone': 'без магазина, на телефоне',
    'Your site, on the home screen.': 'Ваш сайт на домашнем экране.',
    'No App Store. No Google Play. No approvals.': 'Без App Store, без Google Play, без разрешений.',
    'Installs in one tap': 'Ставится в одно касание',
    'Opens full screen, with no address bar': 'Открывается на весь экран, без адресной строки',
    'Works with no signal': 'Работает без сети',
    'Messages straight to the phone, no saved number needed': 'Сообщения прямо на телефон, сохранять номер не нужно',
    // notification buttons (push.js)
    'Turn on notifications': 'Включить уведомления',
    'Send me a test notification': 'Прислать себе тестовое уведомление',
    'Notifications blocked': 'Уведомления заблокированы',
    'Turn them back on in the browser settings for this site.': 'Включить их снова можно в настройках браузера для этого сайта.',
    'This phone is subscribed.': 'Этот телефон подписан.',
    'One moment...': 'Секунду...',
    'Did not work. Try again.': 'Не получилось. Попробуйте ещё раз.',
    'Not allowed, so nothing will arrive.': 'Разрешения нет, поэтому уведомления не придут.',
    'Done. Now send yourself a test.': 'Готово. Теперь пришлите себе тест.',
    'Sent. It lands in a second or two.': 'Отправлено. Придёт через секунду-две.',
    'Install this site and see': 'Установите этот сайт и посмотрите',
    'Tap Share, then Add to Home Screen': 'Нажмите Поделиться, потом На экран Домой',
    'Already on your home screen.': 'Уже на вашем домашнем экране.',
    'Your browser offers it at the top of the page.': 'Браузер предлагает это вверху страницы.',
    'this very site installs,': 'этот сайт сам ставится, ',
    'try it now': 'попробуйте сейчас',
    'send your site address, free check, answer in 24 hours': 'пришлите адрес сайта, проверка бесплатно, ответ за 24 часа',
    'Living art · loops': 'живой арт · петли',
    'A painting, a poster or a photograph set in motion and left to loop on a screen: a shop wall, a lobby, a restaurant, a room at home. Tap any of the four to watch it full size.': 'Картина, плакат или фотография, приведённые в движение и оставленные идти петлёй на экране: стена в магазине, лобби, ресторан, комната дома. Нажми на любую из четырёх, чтобы посмотреть целиком.',
    'Order live art →': 'заказать живой арт →',
    'art that moves': 'оживляем арты',
    'films and living art': 'фильмы и живой арт',
    'drag to spin, the front one': 'потяни, чтобы прокрутить, передний',
    'plays live': 'играет вживую',
    'pick a look, answer a short brief, get a price': 'выбери стиль, ответь на короткий бриф, получи цену',
    'type your brand name': 'напиши название твоего бренда',
    '12 concepts,': '12 концепций,',
    'each its own world': 'каждая — свой мир',
    'type a name, pick a concept, we make it real': 'напиши имя, выбери концепцию, мы сделаем её настоящей',
    '12 live templates,': '12 живых шаблонов, ',
    'each one different': 'каждый не похож на другой',
    'pick a template, live in minutes': 'выбери шаблон, сайт живой через минуты',
    Showreel: 'Шоурил',
    Product: 'Продукт',
    Motion: 'Анимация',
    'Art, AI only': 'Арт, только ИИ',
    'Live + AI': 'Съёмка + ИИ',
    'Vertical hook': 'Вертикальный хук',
    'Brand film': 'Бренд-фильм',
    Concept: 'Концепция',
    'Time lapse': 'Таймлапс',
    live: 'вживую',
    'Sound on': 'Включить звук',

    'Founder, GenVidPro · Tel Aviv, Israel': 'Основатель, GenVidPro · Тель-Авив, Израиль',
    'I build video, brands and sites with AI. One person, a small studio, and a lot of takes until it looks right.':
      'Я делаю видео, бренды и сайты с помощью ИИ. Один человек, небольшая студия и много дублей, пока не станет как надо.',

    'We take the product apart: who it is for, what it replaces, what makes someone choose it. You get the offer, the messages and the price story in writing — the spine everything else hangs on.':
      'Мы разбираем продукт по частям: для кого он, что заменяет, почему его выбирают. Ты получаешь предложение, сообщения и историю цены в письменном виде — это хребет, на котором держится всё остальное.',
    'Name direction, logo, colour, type, packaging and social templates — a small, sharp identity kit you can hand to anyone, plus your logo animated for every intro and end card.':
      'Направление названия, логотип, цвет, шрифт, упаковка и шаблоны для соцсетей — небольшой чёткий набор айдентики, который можно передать кому угодно, плюс анимация логотипа для заставки и финального кадра.',
    'The campaign concept, the hook, the scripts and the storyboard — designed so the same idea works as a 60-second film, a 15-second scroll-stopper and a still.':
      'Концепция кампании, хук, сценарии и раскадровка — сделаны так, чтобы одна идея работала и 60-секундным фильмом, и 15-секундной остановкой ленты, и одним кадром.',
    'Brand films, product spots and logo animation, generated and directed frame by frame, with sound design, voice-over and grade. First cut in 48 hours, 4K master in days.':
      'Бренд-фильмы, ролики о продукте и анимация логотипа: генерируем и режиссируем кадр за кадром, со звуковым дизайном, озвучкой и цветом. Первая сборка за 48 часов, мастер 4K за несколько дней.',
    'Vertical, square and feed versions, subtitles and language swaps, thumbnails and variants for A/B testing — with titles on a separate layer so a price or slogan changes in minutes.':
      'Вертикальные, квадратные и ленточные версии, субтитры и смена языка, обложки и варианты для A/B-тестов — надписи лежат отдельным слоем, поэтому цена или слоган меняются за минуты.',

    'The studio is new. The first three brands pay 25% less.': 'Студия новая. Первые три бренда платят на 25% меньше.',
    'In return we ask for two things: an honest review when the work is live, and the right to show your brand in our portfolio. Same fixed price, same two revision rounds, same deadline. Three places, first come first served.':
      'Взамен мы просим две вещи: честный отзыв, когда работа выйдет, и право показать твой бренд в портфолио. Та же фиксированная цена, те же два круга правок, тот же срок. Три места, кто первый — тот и успел.',
    'Build a brand': 'Сделать бренд',
    'Order a video': 'Заказать видео',
    'Build your own site, free': 'Собрать сайт самому, бесплатно',
    'it plays like a game': 'это работает как игра',

    'A page that just sits there is a business card. These are the parts that make it work while you are cutting hair, cooking, driving or asleep. One setup, then a small monthly to keep it alive.':
      'Страница, которая просто висит, — это визитка. Вот части, которые заставляют её работать, пока ты стрижёшь, готовишь, за рулём или спишь. Одна настройка, дальше небольшая ежемесячная плата, чтобы она жила.',
    'Twelve looks, your name, your colour. Take the HTML and go. No account, no email.':
      'Двенадцать стилей, твоё имя, твой цвет. Забирай HTML и уходи. Без аккаунта и без почты.',
    'Written, designed, on your own domain, fast, and installable as an app from day one. That last part is PWA: your icon on the home screen, opens full screen, still opens with no signal. No App Store, no review, no yearly fee. Every button drops the lead into your WhatsApp, Telegram and email.':
      'Написан, оформлен, на твоём домене, быстрый и с первого дня ставится как приложение. Последнее — это PWA: твой значок на экране телефона, открывается во весь экран и работает даже без связи. Ни App Store, ни модерации, ни платы за год. Любая кнопка кладёт заявку тебе в WhatsApp, Telegram и на почту.',
    'People ask about price or hours, by voice or by typing, in their own language. It answers and sends you the name and the number.':
      'Люди спрашивают про цену или часы работы — голосом или текстом, на своём языке. Он отвечает и присылает тебе имя и номер.',
    'Takes bookings, answers the same five questions people always ask, reminds them the day before, hands you the rest.':
      'Принимает записи, отвечает на те же пять вопросов, что задают всегда, напоминает за день, остальное передаёт тебе.',
    'Web AR. Your customer points the phone at the wall and the fridge, the sofa or the washing machine stands there at real size. Nothing to install. It answers the one question that stops the sale: will it fit.':
      'Дополненная реальность прямо в браузере. Клиент наводит телефон на стену — и холодильник, диван или стиральная машина стоят там в натуральную величину. Ничего не нужно устанавливать. Это отвечает на главный вопрос, который останавливает покупку: влезет ли.',
    'You get a code word. Type it on your own page and the prices and the hours become editable, right there. Bigger things, a new address or a new section, stay with us.':
      'Ты получаешь кодовое слово. Набираешь его на своей странице — и цены и часы работы становятся редактируемыми прямо там. Что покрупнее — новый адрес или новый раздел — остаётся за нами.',
    'Who came, what they played, which button they pressed, where they left. One short report a month, in words, not charts you have to decode.':
      'Кто пришёл, что смотрел, на какую кнопку нажал, где ушёл. Один короткий отчёт в месяц, словами, а не графиками, которые надо расшифровывать.',
    'Ten seconds of your place, your hands, your product. Cut for the page and for reels.':
      'Десять секунд твоего места, твоих рук, твоего продукта. Смонтировано и для страницы, и для рилсов.',
    'Hosting, domain renewal, backups, we watch that it stays up. Two text or photo changes a month, you send them on WhatsApp.':
      'Хостинг, продление домена, резервные копии, мы следим, чтобы сайт был жив. Две правки текста или фото в месяц — присылаешь их в WhatsApp.',
    'Care, plus the assistant answering on the page and every lead pushed to WhatsApp, Telegram and email. Five changes a month.':
      'Всё из Care плюс ассистент, отвечающий на странице, и каждая заявка в WhatsApp, Telegram и на почту. Пять правок в месяц.',
    'Connected, plus the monthly numbers and one change to the page because of them. First month free.':
      'Всё из Connected плюс ежемесячные цифры и одна правка страницы по их следам. Первый месяц бесплатно.',
    'Cancel any month. The site and the files stay yours either way. US studios charge $5,000 and up for the same package, and $75 to $150 a month to keep it.':
      'Отменить можно в любой месяц. Сайт и файлы в любом случае остаются твоими. Американские студии берут за такой же пакет от 5 000 долларов и от 75 до 150 долларов в месяц за поддержку.',
    'Ask for a discount': 'Попросить скидку',

    'Just a product': 'Только продукт',
    'No brand, no idea how to sell it yet': 'Бренда нет, и пока непонятно, как это продавать',
    'Brand, no campaign': 'Бренд есть, кампании нет',
    'The look exists, the ads do not': 'Внешний вид есть, рекламы нет',
    'One piece only': 'Нужна одна вещь',
    'You know exactly what you need': 'Ты точно знаешь, что тебе нужно',

    '01 - Positioning & offer': '01 - Позиционирование и предложение',
    'Audience, offer, messages and price story, in writing': 'Аудитория, предложение, сообщения и история цены — письменно',
    '02 - Brand identity kit': '02 - Набор фирменного стиля',
    'Logo, colour, type, social templates, guidelines, source files': 'Логотип, цвет, шрифт, шаблоны для соцсетей, гайдлайны, исходники',
    '02 - Logo animation': '02 - Анимация логотипа',
    'Intro, loop and vertical versions of your mark': 'Заставка, зацикленная и вертикальная версии твоего знака',
    '03 - Campaign concept & scripts': '03 - Концепция кампании и сценарии',
    'The idea, the hook, scripts and storyboard': 'Идея, хук, сценарии и раскадровка',
    '04 - Brand film, 30 sec': '04 - Бренд-фильм, 30 секунд',
    'Cinematic spot with sound design, voice-over and grade': 'Кинематографичный ролик со звуковым дизайном, озвучкой и цветом',
    '04 - Single spot, 15–30 sec': '04 - Один ролик, 15–30 секунд',
    'One product or brand video, vertical or wide, sound and titles included': 'Одно видео о продукте или бренде, вертикальное или широкое, со звуком и надписями',
    '04 - Product ads, 3 x 15 sec': '04 - Реклама продукта, 3 × 15 секунд',
    'Three variants built for the feed and A/B testing': 'Три варианта под ленту и A/B-тесты',
    '05 - Platform cuts & captions': '05 - Версии под площадки и субтитры',
    '9:16, 1:1, subtitles, thumbnails and title layers': '9:16, 1:1, субтитры, обложки и слои с надписями',
    '06 - Website, built and live': '06 - Сайт, собран и запущен',
    'Written, designed, your own domain, fast, installable as an app, leads into WhatsApp': 'Написан, оформлен, на твоём домене, быстрый, ставится как приложение, заявки идут в WhatsApp',
    '06 - Assistant that talks': '06 - Ассистент, который говорит',
    'Answers price and hours by voice or text, sends you the lead': 'Отвечает про цену и часы голосом или текстом, присылает тебе заявку',
    '06 - Telegram and WhatsApp bot': '06 - Бот в Telegram и WhatsApp',
    'Takes bookings, answers the usual questions, reminds the day before': 'Принимает записи, отвечает на обычные вопросы, напоминает за день',
    '06 - See it in your room (web AR)': '06 - Посмотреть у себя в комнате (AR в браузере)',
    'Your product at real size in their room, no app. Plus $180 per product': 'Твой товар в натуральную величину у них в комнате, без приложения. Плюс 180 долларов за товар',
    '06 - Change it yourself': '06 - Менять самому',
    'A code word on your own page unlocks prices and hours for editing': 'Кодовое слово на твоей странице открывает цены и часы для правки',
    '06 - Numbers you can act on': '06 - Цифры, с которыми можно работать',
    'Who came, what they clicked, where they left — one report a month, in words': 'Кто пришёл, куда нажал, где ушёл — один отчёт в месяц, словами',

    'Extra language': 'Дополнительный язык',
    'Second language track or subtitles': 'Вторая звуковая дорожка или субтитры',
    'Paid-ads licence, 30 days': 'Лицензия на платную рекламу, 30 дней',
    'Unlimited paid distribution for a month': 'Неограниченный платный показ в течение месяца',
    'Extra revision round': 'Дополнительный круг правок',
    'One more pass beyond the two included': 'Ещё один заход сверх двух включённых',
    'Rush delivery': 'Срочная сдача',
    'Everything moves to the front of the queue': 'Всё переходит в начало очереди',
    'Care — care plan': 'Care — план поддержки',
    'Hosting, domain, backups, uptime, two changes a month': 'Хостинг, домен, резервные копии, доступность, две правки в месяц',
    'Connected — care plan': 'Connected — план поддержки',
    'Care plus the assistant and leads pushed to WhatsApp, Telegram and email': 'Всё из Care плюс ассистент и заявки в WhatsApp, Telegram и на почту',
    'Growth — care plan': 'Growth — план поддержки',
    'Connected plus monthly numbers and one change made from them — first month free': 'Всё из Connected плюс ежемесячные цифры и одна правка по их следам — первый месяц бесплатно',

    'Your brief — five questions, the rest optional': 'Твой бриф — пять вопросов, остальные по желанию',
    'Five required questions first, forty-five optional ones below them. Tap to choose, type where a line is offered.':
      'Сначала пять обязательных вопросов, ниже — сорок пять по желанию. Нажимай, чтобы выбрать, и пиши там, где есть строка.',
    'Required · 5 questions': 'Обязательно · 5 вопросов',
    '45 optional questions': '45 вопросов по желанию',
    'help us land closer': 'помогают попасть точнее',
    'Your name': 'Твоё имя',
    'Email or WhatsApp number': 'Почта или номер WhatsApp',
    'What do you sell, in one line': 'Что ты продаёшь, одной строкой',
    'What should the work do first': 'Что работа должна сделать в первую очередь',
    'Sell now': 'Продавать сейчас',
    'Launch a new product': 'Запустить новый продукт',
    'Explain how it works': 'Объяснить, как это работает',
    'Build trust': 'Построить доверие',
    'Recruit or investors': 'Нанять людей или найти инвесторов',
    'Deadline or launch date': 'Срок или дата запуска',
    'Company or brand name': 'Название компании или бренда',
    'Website or Instagram': 'Сайт или Instagram',
    'Country and language of your customers': 'Страна и язык твоих клиентов',
    'How long has the business existed': 'Сколько лет бизнесу',
    'Not launched yet': 'Ещё не запущен',
    'Under a year': 'Меньше года',
    '1–3 years': '1–3 года',
    '3+ years': 'Больше 3 лет',
    'Price range of the product': 'Ценовой диапазон продукта',
    'Under $30': 'До 30 долларов',
    Subscription: 'Подписка',
    'Physical product, digital or service': 'Физический товар, цифровой или услуга',
    Physical: 'Физический',
    Digital: 'Цифровой',
    Service: 'Услуга',
    'App / SaaS': 'Приложение / SaaS',
    Course: 'Курс',
    'The one thing that makes it better than the alternatives': 'Единственное, что делает его лучше альтернатив',
    'Your three closest competitors, names or links': 'Три ближайших конкурента: названия или ссылки',
    'Three words customers use when they praise it': 'Три слова, которыми клиенты его хвалят',
    'Can you ship us the product or send photos': 'Сможешь прислать нам товар или фотографии',
    'Ship a sample': 'Пришлю образец',
    'Send photos': 'Пришлю фото',
    'Renders only': 'Только рендеры',
    'Nothing yet': 'Пока ничего',
    'Age of your typical buyer': 'Возраст типичного покупателя',
    Mixed: 'Смешанный',
    'Gender balance': 'Соотношение по полу',
    'Mostly women': 'В основном женщины',
    'Mostly men': 'В основном мужчины',
    Even: 'Поровну',
    'What problem they have before finding you': 'Какая у них проблема до того, как они тебя нашли',
    'What stops them from buying today': 'Что мешает им купить сегодня',
    'Where they spend time online': 'Где они проводят время в сети',
    'Google search': 'Поиск Google',
    'B2C, B2B or both': 'B2C, B2B или и то и другое',
    Both: 'И то и другое',
    'How you will measure success': 'Чем будешь мерить успех',
    Sales: 'Продажи',
    Leads: 'Заявки',
    'Views and reach': 'Просмотры и охват',
    Followers: 'Подписчики',
    'Brand feel': 'Ощущение бренда',
    'Where the videos will run': 'Где будут крутиться ролики',
    'Instagram / Reels': 'Instagram / Reels',
    'Meta ads': 'Реклама в Meta',
    'Google / YouTube ads': 'Реклама в Google / YouTube',
    Website: 'Сайт',
    'Amazon listing': 'Карточка на Amazon',
    'TV / events': 'ТВ / мероприятия',
    'Formats you need': 'Нужные форматы',
    '9:16 vertical': '9:16 вертикальный',
    '16:9 wide': '16:9 широкий',
    '1:1 square': '1:1 квадратный',
    '4:5 feed': '4:5 для ленты',
    'Lengths you need': 'Нужные длительности',
    '6 s bumper': 'Бампер 6 секунд',
    '2–3 min': '2–3 минуты',
    'Paid ads or organic posting': 'Платная реклама или органика',
    'Paid ads': 'Платная реклама',
    Organic: 'Органика',
    'What you already have': 'Что у тебя уже есть',
    Logo: 'Логотип',
    'Brand book': 'Брендбук',
    'Colours and fonts': 'Цвета и шрифты',
    'Product photos': 'Фотографии товара',
    'Existing videos': 'Готовые ролики',
    'Keep the current look or start fresh': 'Сохранить нынешний вид или начать с нуля',
    'Keep it': 'Сохранить',
    'Refresh it': 'Освежить',
    'Start fresh': 'Начать с нуля',
    'Not sure': 'Не уверен',
    'Brand personality in three words': 'Характер бренда тремя словами',
    'Tone you want': 'Нужная интонация',
    'Premium and calm': 'Премиально и спокойно',
    'Bold and loud': 'Дерзко и громко',
    'Warm and friendly': 'Тепло и по-дружески',
    'Tech and precise': 'Технологично и точно',
    Playful: 'Игриво',
    Luxury: 'Роскошно',
    Minimal: 'Минималистично',
    'Colours you love or must keep': 'Цвета, которые ты любишь или которые нужно сохранить',
    'Colours or styles to avoid': 'Цвета или стили, которых избегать',
    'Link to a video you wish was yours, and why': 'Ссылка на ролик, который хотели бы иметь, и почему',
    'A second reference, video or brand': 'Второй референс: ролик или бренд',
    'A brand whose style you dislike, and why': 'Бренд, чей стиль тебе не нравится, и почему',
    'Real people on camera or product only': 'Живые люди в кадре или только продукт',
    'Product only': 'Только продукт',
    'Hands and details': 'Руки и детали',
    'A presenter': 'Ведущий',
    'Lifestyle scenes': 'Сцены из жизни',
    Animated: 'Анимация',
    'Music feel': 'Настроение музыки',
    Cinematic: 'Кинематографично',
    Electronic: 'Электроника',
    'Warm acoustic': 'Тёплая акустика',
    'Upbeat pop': 'Бодрый поп',
    'Silent, sound design only': 'Без музыки, только звуковой дизайн',
    'You choose': 'На твой выбор',
    'Voice-over': 'Закадровый голос',
    Male: 'Мужской',
    Female: 'Женский',
    'No voice, titles only': 'Без голоса, только надписи',
    'Languages for voice and subtitles': 'Языки для озвучки и субтитров',
    'The one message the viewer must remember': 'Единственная мысль, которую зритель должен запомнить',
    'Call to action at the end': 'Призыв к действию в конце',
    'Shop now': 'Купить сейчас',
    'Visit the site': 'Зайти на сайт',
    'Follow us': 'Подписаться',
    'Book a call': 'Записаться на звонок',
    'Download the app': 'Скачать приложение',
    'Pre-order': 'Предзаказ',
    'Offer, price or promo code to show': 'Предложение, цена или промокод, которые надо показать',
    'Legal lines or claims we must include or avoid': 'Юридические строки или утверждения, которые надо включить или избежать',
    'Product features that must be seen on screen': 'Свойства товара, которые обязательно должны быть видны',
    'Anything that must never appear': 'То, чего не должно быть никогда',
    'Who approves the work on your side': 'Кто утверждает работу с твоей стороны',
    'Just me': 'Только я',
    'Me and a partner': 'Я и партнёр',
    'A team': 'Команда',
    'How fast you can give feedback': 'Как быстро ты даёшь обратную связь',
    'Same day': 'В тот же день',
    'Within 2 days': 'За два дня',
    'Within a week': 'В течение недели',
    'Preferred channel': 'Удобный канал связи',
    Email: 'Почта',
    'Video call': 'Видеозвонок',
    'How you found us': 'Откуда ты о нас знаешь',
    Referral: 'По рекомендации',
    Other: 'Другое',
    'Anything else we should know': 'Что ещё нам стоит знать',

    'Nothing here is binding. We read the brief, reply within one working day with a written plan, and only then you decide.':
      'Ничто здесь ни к чему не обязывает. Мы читаем бриф, в течение одного рабочего дня отвечаем письменным планом, и только потом ты решаешь.',
    'Start with step 01, where are you now': 'Начни с шага 01: где ты сейчас',
    '50% to start, 50% on delivery.': '50% на старте, 50% при сдаче.',
    'Send the brief by email': 'Отправить бриф по почте',
    'Send it on WhatsApp': 'Отправить в WhatsApp',
    'Gift with every order:': 'Подарок к каждому заказу:',
    'a vertical 9:16 cut of your main video, free. Worth $300.': 'вертикальная версия 9:16 твоего главного ролика, бесплатно. Стоит 300 долларов.',
    'Review & send': 'Проверить и отправить',

    'Frequently asked questions': 'Частые вопросы',
    'I only have a product and no idea how to sell it. Is that enough?': 'У меня есть только продукт и никакого понимания, как его продавать. Этого достаточно?',
    'That is the normal starting point here. Stage 01 turns the product into an offer — who it is for, what it replaces, why it is worth the price — and everything after is built on it.':
      'Это здесь нормальная точка старта. Шаг 01 превращает продукт в предложение — для кого он, что заменяет, почему стоит своих денег — и всё дальнейшее строится на нём.',
    'Why one studio instead of an agency, a designer and a film crew?': 'Почему одна студия, а не агентство, дизайнер и съёмочная группа?',
    'Because the idea survives. The person who writes the positioning also directs the film and cuts the vertical version, so nothing is lost in three hand-offs — and it costs a fraction of four invoices.':
      'Потому что идея выживает. Тот, кто пишет позиционирование, сам режиссирует фильм и монтирует вертикальную версию, поэтому ничего не теряется при трёх передачах — и стоит это долю от четырёх счетов.',
    'Is this real production or stock footage?': 'Это настоящее производство или стоковые кадры?',
    'Every frame is generated and directed for your brief — no stock library, no template. The work above is the honest sample of what you get.':
      'Каждый кадр сгенерирован и срежиссирован под твой бриф — никаких стоков и шаблонов. Работы выше — честный образец того, что ты получишь.',
    'What if I do not like the first cut?': 'А если мне не понравится первая сборка?',
    'Two revision rounds sit inside every stage, and the first cut lands on day two precisely so a change of direction is cheap. If the concept is wrong at that point, you pay the deposit only and we stop.':
      'В каждый этап заложено два круга правок, а первая сборка приходит на второй день именно затем, чтобы смена направления стоила дёшево. Если на этом месте концепция неверна, ты платишь только задаток, и мы останавливаемся.',
    'Who owns the brand and the videos?': 'Кому принадлежат бренд и ролики?',
    'You do. Full rights and the source files are included in the identity stage and available as an add-on for video.':
      'Тебе. Полные права и исходники входят в этап айдентики и доступны как дополнение для видео.',
    'How do I pay, and how fast is it?': 'Как платить и как быстро всё будет?',
    '50% to begin, 50% on delivery. The deposit button opens PayPal with the exact amount already filled in — card or PayPal balance, no account needed to pay. Bank transfer and an invoice are available too. A single video takes 3–7 days; a full brand-to-launch package runs three to five weeks.':
      '50% на старте, 50% при сдаче. Кнопка задатка открывает PayPal с уже вписанной суммой — картой или с баланса PayPal, аккаунт для оплаты не нужен. Есть и банковский перевод со счётом. Один ролик занимает 3–7 дней; полный пакет от бренда до запуска — от трёх до пяти недель.',

    Terms: 'Условия',
    Privacy: 'Конфиденциальность',
    'Close ✕': 'Закрыть ✕',
    Install: 'Установить',
    'Type here': 'Напиши здесь',

    'free site builder': 'бесплатный конструктор сайтов',
    'Pick a look, type your name, move the colour. What you see is the real page, live, not a picture of one.':
      'Выбери вид, впиши своё имя, подвинь цвет. То, что ты видишь, — настоящая живая страница, а не её картинка.',
    'Twelve looks for a barbershop. Tap one to load it below.': 'Двенадцать видов для барбершопа. Нажми на любой, чтобы открыть его ниже.',
    'Twelve looks for a dental clinic. Tap one to load it below.': 'Двенадцать видов для стоматологии. Нажми на любой, чтобы открыть его ниже.',
    'Twelve looks for an electronics store. Tap one to load it below.': 'Двенадцать видов для магазина электроники. Нажми на любой, чтобы открыть его ниже.',
    'Twelve looks for a yoga studio. Tap one to load it below.': 'Двенадцать видов для студии йоги. Нажми на любой, чтобы открыть его ниже.',
    'Twelve looks for a furniture store. Tap one to load it below.': 'Двенадцать видов для мебельного магазина. Нажми на любой, чтобы открыть его ниже.',
    Barbershop: 'Барбершоп',
    'Dental clinic': 'Стоматология',
    'Electronics store': 'Магазин электроники',
    'Yoga studio': 'Студия йоги',
    'Furniture store': 'Мебельный магазин',
    'Creative studio': 'Творческая студия',
    'by': ' — ',
    'live': 'живьём',
    'live preview': 'живой показ',
    'drag to spin, the front one': 'потяни, чтобы покрутить, передний ',
    'plays live': 'играет живьём',
    '12 live templates,': '12 живых шаблонов, ',
    'each one different': 'каждый свой',
    '12 concepts,': '12 концептов, ',
    'each its own world': 'у каждого свой мир',
    'ORDER LIVING ART': 'ЗАКАЗАТЬ ЖИВОЙ АРТ ',
    'ORDER A LIVING PAINTING': 'ЗАКАЗАТЬ ЖИВУЮ КАРТИНУ ',
    'ORDER YOUR VIDEO': 'ЗАКАЗАТЬ ВИДЕО ',
    'BUILD IT AND INSTALL IT': 'СОБРАТЬ И УСТАНОВИТЬ ',
    'no app store': 'без магазина приложений',
    'twelve templates, free, live in minutes, installs like an app': 'двенадцать шаблонов, бесплатно, сайт живой через минуты, ставится как приложение',
    'No site yet? Build one free, in minutes →': 'Ещё нет сайта? Соберите бесплатно за несколько минут →',
    // thanks and 404
    'Deposit received': 'Задаток получен',
    'Thank you. Your project is booked. You will get the written plan — stages, dates and the first concept — within one working day, at the contact you left with the order.':
      'Спасибо. Ваш проект забронирован. В течение одного рабочего дня вы получите письменный план: этапы, даты и первую концепцию, по контакту, который оставили в заказе.',
    'Back to GenVidPro': 'Вернуться на GenVidPro',
    'Error 404 — nothing at this address': 'Ошибка 404, по этому адресу ничего нет',
    'This frame does not exist': 'Такого кадра не существует',
    'The page you asked for was moved or never made. The work, the prices and the order form all live on the front page.':
      'Страница, которую вы искали, перенесена или никогда не существовала. Работы, цены и форма заказа живут на главной странице.',
    'See the work': 'Смотреть работы',
    'BUILD YOUR SITE, FREE': 'СОБРАТЬ САЙТ, БЕСПЛАТНО ',
    'BUILD YOUR BRAND, FREE': 'СОБРАТЬ БРЕНД, БЕСПЛАТНО ',
    'your picture or a public-domain painting · Full HD, 4K on request · quote in 24 hours': 'твоя картинка или картина из общественного достояния · Full HD, 4K по запросу · цена за 24 часа',
    'pick a look, answer a short brief, get a price': 'выбери стиль, ответь на короткий бриф, получи цену',
    'pick a template, live in minutes': 'выбери шаблон — в сети за минуты',
    'type a name, pick a concept, we make it real': 'впиши имя, выбери концепт, мы сделаем',
    'split hero': 'двойной первый экран',
    'ticket price list': 'прайс как билет',
    'quiet, serif': 'тихий, с засечками',
    'card grid': 'сетка карточек',
    'sign and ticker': 'вывеска и бегущая строка',
    'sign + ticker': 'вывеска + бегущая строка',
    'name fills the page': 'имя на весь экран',
    'photocopy, taped': 'ксерокс, на скотче',
    'magazine index': 'оглавление журнала',
    'booking first': 'сначала запись',
    'colour stripes': 'цветные полосы',
    'color stripes': 'цветные полосы',
    'all monospace': 'всё моноширинным',
    'gold, framed': 'золото, в раме',
    'Terms': 'Условия',
    'Privacy': 'Конфиденциальность',
    'Tel Aviv, Israel': 'Тель-Авив, Израиль',
    '· Tel Aviv, Israel': '· Тель-Авив, Израиль',
    'Close ✕': 'Закрыть ✕',
    'TAP TO ADD OR REMOVE': 'НАЖМИ, ЧТОБЫ ДОБАВИТЬ ИЛИ УБРАТЬ',
    'Tap to add or remove': 'нажми, чтобы добавить или убрать',
    '— tap to add or remove': '— нажми, чтобы добавить или убрать',
    'What we build — tap to add or remove': 'Что делаем — нажми, чтобы добавить или убрать',
    'Keep it alive — monthly, cancel any month': 'Поддержка — помесячно, отмена в любой месяц',
    'MONTHLY, CANCEL ANY MONTH': 'ПОМЕСЯЧНО, ОТМЕНА В ЛЮБОЙ МЕСЯЦ',
    'Connected': 'На связи',
    'Connected — care plan': 'На связи — план поддержки',
    'Make your own': 'Собери сам',
    'business site': 'сайт для бизнеса',
    'category': 'категория',
    'look': 'стиль',
    'your brand': 'твой бренд',
    'take it': 'забирай',
    '← genvidpro.com': '← genvidpro.com',
    'A painting that moves and loops on a screen: a gallery, a lobby, a restaurant, a shop, a room at home. Pick a work that is free to animate or send your own, and we come back with a quote within 24 hours.': 'Картина, которая движется и идёт по кругу на экране: галерея, лобби, ресторан, магазин, комната дома. Выбери работу, которую можно оживить, или пришли свою — и в течение 24 часов мы назовём цену.',
    'Not only paintings — a timelapse, a story, a brand film, or a living person put into any world. SHELTER, MOLT and Robert’s Worlds were made the same way.': 'Не только картины — таймлапс, история, фильм для бренда или живой человек в любом мире. SHELTER, MOLT и Robert’s Worlds сделаны так же.',
    'What we animate': 'Что оживляем',
    'Find a work': 'Найти работу',
    'Upload your own': 'Загрузить свою',
    'Search': 'Искать',
    'Search by artist or title': 'Поиск по художнику или названию',
    'Only works already free to use are shown — The Met and Wikimedia Commons': 'Показаны только работы, свободные для использования — The Met и Wikimedia Commons',
    'Ordering a timelapse, a story or a brand film instead? Skip this step and go straight to': 'Заказываешь таймлапс, историю или фильм для бренда? Пропусти этот шаг и иди сразу к ',
    'This work may still be under copyright, so we cannot animate it. Try another artist, or upload your own image below.': 'Возможно, на эту работу ещё действуют авторские права, и мы не можем её оживить. Попробуй другого художника или загрузи свою картинку ниже.',
    'Search is temporarily unavailable, please upload your image instead.': 'Поиск временно недоступен — загрузи, пожалуйста, свою картинку.',
    'Upload your own image': 'Загрузить свою картинку',
    'Load more': 'Показать ещё',
    'Loading…': 'Загружаю…',
    'Drop your image here': 'Перетащи картинку сюда',
    'portrait, poster, photo, artwork, anything': 'портрет, плакат, фото, картина, что угодно',
    'Choose a file': 'Выбрать файл',
    'jpg or png, up to 25 MB': 'jpg или png, до 25 МБ',
    'I own this image or it is in the public domain.': 'Картинка моя или находится в общественном достоянии.',
    'We check every upload manually before production.': 'Каждую загрузку мы проверяем вручную до производства.',
    'What we make': 'Что делаем',
    'A painting brought to life': 'Оживлённая картина',
    'A still image, moving and looping': 'Неподвижная картинка, которая движется по кругу',
    'A timelapse': 'Таймлапс',
    'Growth, weather, a city, a build': 'Рост, погода, город, стройка',
    'A story or a fairy tale': 'История или сказка',
    'Characters and a plot, told in a minute': 'Герои и сюжет за одну минуту',
    'A brand or concept film': 'Фильм для бренда или концепт',
    'The way SHELTER and MOLT were made': 'Как сделаны SHELTER и MOLT',
    'A person in any world': 'Человек в любом мире',
    'A real face put into any set — the way Robert’s Worlds was made': 'Живое лицо в любых декорациях — как сделан Robert’s Worlds',
    'Something else': 'Что-то другое',
    'Write it in the line below and we will say if we can': 'Напиши в строке ниже — скажем, сможем ли',
    'In one line: what happens on the screen?': 'В одну строку: что происходит на экране?',
    'The sea in the painting starts to move, gulls fly through': 'Море на картине начинает двигаться, пролетают чайки',
    'How many pieces': 'Сколько работ',
    'One artwork': 'Одна работа',
    '2 minute seamless loop': 'бесшовная петля 2 минуты',
    'from $1,800': 'от $1,800',
    'Series of 3': 'Серия из 3',
    'Three works, one programme': 'Три работы, одна программа',
    'from $4,500 ($1,500 per work, save 17%)': 'от $4,500 ($1,500 за работу, экономия 17%)',
    'Series of 8': 'Серия из 8',
    'The full set for a screen': 'Полный набор для экрана',
    'from $9,600 ($1,200 per work, save 33%)': 'от $9,600 ($1,200 за работу, экономия 33%)',
    'Formats': 'Форматы',
    'Screens and TVs': 'Экраны и телевизоры',
    '9:16 vertical': '9:16 вертикальный',
    'Phones, totems, reels': 'Телефоны, стойки, рилсы',
    'Ultrawide': 'Сверхширокий',
    'For an LED wall': 'Для LED-стены',
    'Everything is delivered in': 'Всё сдаётся в ',
    '. For a large screen or an LED wall we master in 4K, and that is priced on top.': '. Для большого экрана или LED-стены делаем мастер в 4K — это за доплату.',
    '4K master': 'Мастер 4K',
    'For big screens and LED walls': 'Для больших экранов и LED-стен',
    ', +30%': ', +30%',
    'Licence': 'Лицензия',
    'Non-exclusive': 'Неэксклюзивная',
    'You use it, we can license the same work to others.': 'Ты пользуешься, а мы можем продать лицензию на ту же работу и другим.',
    'Included in the price above.': 'Входит в цену выше.',
    'Exclusive': 'Эксклюзивная',
    'We will not license this work to anyone else for the agreed term and territory.': 'Мы не продадим лицензию на эту работу никому другому на оговорённый срок и территорию.',
    '×2.5': '×2.5',
    'We send a quote within 24 hours.': 'Пришлём цену в течение 24 часов.',
    'Final quote within 24 hours.': 'Точная цена — в течение 24 часов.',
    'Custom work — we price it after we understand the brief. Quote within 24 hours.': 'Работа под заказ — оценим, когда поймём бриф. Цена в течение 24 часов.',
    'Planning a full 30 minute programme for a venue? We price that separately.': 'Планируешь полную 30-минутную программу для площадки? Это считаем отдельно.',
    'Where to send it': 'Куда отправить',
    'Name': 'Имя',
    'Email': 'Email',
    'Company': 'Компания',
    '(optional)': '(необязательно)',
    'Where will this be shown?': 'Где это будет показываться?',
    'Venue, exhibition, screen, hotel': 'Площадка, выставка, экран, отель',
    'Send request': 'Отправить заявку',
    'Sending…': 'Отправляю…',
    'Sent — we reply within one working day': 'Отправлено. Ответим в течение одного рабочего дня',
    'Name and email, please.': 'Имя и email, пожалуйста.',
    'Pick a work above, or send your own picture.': 'Выбери работу выше или пришли свою картинку.',
    'Write in one line what should happen on the screen.': 'Напиши в одну строку, что должно происходить на экране.',
    'Tick the line saying the picture is yours or in the public domain.': 'Отметь, что картинка твоя или в общественном достоянии.',
    'Could not send just now. Try again in a minute, or write to genvidpro@gmail.com': 'Не удалось отправить. Попробуй через минуту или напиши на genvidpro@gmail.com',
    'Could not take that file. Try another one, or write to genvidpro@gmail.com': 'Не удалось принять файл. Попробуй другой или напиши на genvidpro@gmail.com',
    'Only jpg or png, please.': 'Только jpg или png, пожалуйста.',
    'That file is over 25 MB. Send a smaller copy.': 'Файл больше 25 МБ. Пришли копию поменьше.',
    'Got it': 'Принято',
    'We will come back within 24 hours.': 'Ответим в течение 24 часов.',
    'Look closer': 'Рассмотреть',
    /* terms.html / privacy.html, 10 September 2026 */
    'Terms of Service': 'Условия обслуживания',
    'Privacy Policy': 'Политика конфиденциальности',
    'Last updated 10 September 2026': 'Обновлено 10 сентября 2026',
    'These terms apply to every order placed with GenVidPro (Roman Chorny, Tel Aviv, Israel) through genvidpro.com, email or WhatsApp.': 'Эти условия действуют для каждого заказа, оформленного у GenVidPro (Roman Chorny, Tel Aviv, Israel) через genvidpro.com, почту или WhatsApp.',
    '1. The offer': '1. Предложение',
    'Prices shown on the site are starting prices in US dollars for the described scope. The final price depends on the brief and is confirmed in a written plan with stages and dates, sent before any payment. The plan is the contract.': 'Цены на сайте — стартовые цены в долларах США за описанный объём работы. Окончательная цена зависит от брифа и подтверждается письменным планом с этапами и датами, который приходит до любой оплаты. План и есть договор.',
    '2. Payment': '2. Оплата',
    '50% deposit to begin, 50% on delivery of the final files. Payment by PayPal, card through PayPal, or bank transfer. Work starts when the deposit arrives.': '50% задаток в начале, 50% при передаче финальных файлов. Оплата через PayPal, картой через PayPal или банковским переводом. Работа начинается, когда пришёл задаток.',
    '3. Revisions': '3. Правки',
    'Two revision rounds are included in every stage. Further rounds are priced by agreement before they start. A change of concept after approval of the previous stage is a new order.': 'В каждый этап входят два круга правок. Дополнительные круги оцениваются по договорённости до их начала. Смена концепции после утверждения предыдущего этапа — это новый заказ.',
    '4. Cancellation': '4. Отмена',
    'You may stop after any stage. The deposit covers the work done to that point and is not refunded once production has started. If we cannot deliver, the unused part of the deposit is returned.': 'Ты можешь остановиться после любого этапа. Задаток покрывает работу, сделанную к этому моменту, и не возвращается, когда производство уже началось. Если мы не можем сдать работу, неиспользованная часть задатка возвращается.',
    '5. Rights': '5. Права',
    'On full payment you own the delivered brand assets and videos for your own commercial use. Source files and unlimited paid-advertising rights are included where the order says so, otherwise available as add-ons. We may show the work in our portfolio unless you ask us not to in writing.': 'После полной оплаты ты владеешь переданными материалами бренда и видео для собственного коммерческого использования. Исходники и неограниченные права на платную рекламу входят туда, где это указано в заказе, иначе доступны как дополнение. Мы можем показывать работу в портфолио, если ты письменно не попросишь этого не делать.',
    'Living Paintings are licensed, not sold. With a non-exclusive licence you may use the animation for your own purposes, and we may license the same work to others. With an exclusive licence we will not license this work to anyone else for the agreed term and territory. The licence starts on full payment.': 'Living Paintings лицензируются, а не продаются. При неэксклюзивной лицензии ты используешь анимацию в своих целях, а мы можем лицензировать ту же работу другим. При эксклюзивной лицензии мы не будем лицензировать эту работу никому другому на согласованный срок и территорию. Лицензия начинает действовать после полной оплаты.',
    '6. Materials you provide': '6. Материалы, которые ты присылаешь',
    'You confirm you have the right to use every logo, photo, text and product you send us. AI-generated material is produced for your brief and checked by a human; it is not stock footage.': 'Ты подтверждаешь, что имеешь право использовать каждый логотип, фото, текст и товар, которые нам присылаешь. Материал, сгенерированный ИИ, делается под твой бриф и проверяется человеком; это не стоковые кадры.',
    '7. Liability': '7. Ответственность',
    'Our liability is limited to the amount paid for the order. We do not guarantee sales results.': 'Наша ответственность ограничена суммой, уплаченной за заказ. Мы не гарантируем результатов продаж.',
    '8. Contact': '8. Контакт',
    'GenVidPro collects only what is needed to answer your request and deliver the work.': 'GenVidPro собирает только то, что нужно, чтобы ответить на твой запрос и сдать работу.',
    'What we collect': 'Что мы собираем',
    'Your name, company, email or WhatsApp number, links you share, the answers you give in the order brief, and the images you upload for Living Paintings. Payments are processed by PayPal; we never see your card details.': 'Твоё имя, компанию, почту или номер WhatsApp, ссылки, которыми ты делишься, ответы в брифе заказа и изображения, которые ты загружаешь для Living Paintings. Платежи обрабатывает PayPal; данных твоей карты мы не видим.',
    'Why': 'Зачем',
    'To reply to you, prepare the plan, produce the work and issue invoices. We do not sell or share your data with anyone except the services needed to deliver: email, PayPal and file storage.': 'Чтобы ответить тебе, подготовить план, сделать работу и выставить счета. Мы не продаём и не передаём твои данные никому, кроме сервисов, нужных для сдачи работы: почта, PayPal и хранилище файлов.',
    'Storage': 'Хранение',
    'Briefs and files are kept in our email and Google Drive for the duration of the project and up to two years after, then deleted on request or by routine clean-up. Files uploaded through Living Paintings are stored on our server for up to 60 days, are reachable by their direct link, and are then deleted automatically. Uploads are limited to 12 files per address per day.': 'Брифы и файлы хранятся в нашей почте и Google Drive на время проекта и до двух лет после, затем удаляются по запросу или при плановой чистке. Файлы, загруженные через Living Paintings, хранятся на нашем сервере до 60 дней, доступны по прямой ссылке и затем удаляются автоматически. Лимит — 12 файлов с одного адреса в день.',
    'Cookies and analytics': 'Cookies и аналитика',
    'The site uses no tracking cookies and no third-party analytics.': 'Сайт не использует отслеживающие cookies и стороннюю аналитику.',
    'Your rights': 'Твои права',
    'Ask us at any time to see, correct or delete what we hold about you: genvidpro@gmail.com.': 'В любой момент попроси нас показать, исправить или удалить то, что мы о тебе храним: genvidpro@gmail.com.',
  };

  /* Sentences the page writes at runtime, with a number or a sum inside them.
     A dictionary keyed by the whole string cannot hold those, so they are
     matched by shape and rebuilt. */
  var PAT = [
    [/^(\d+) works free to animate — The Met and Wikimedia Commons$/, {
      he: function (m) { return m[1] + ' יצירות שמותר להנפיש — The Met ו-Wikimedia Commons'; },
      ru: function (m) { return m[1] + ' работ можно оживить — The Met и Wikimedia Commons'; }
    }],
    [/^Chosen: (\d+)$/, {
      he: function (m) { return 'נבחרו: ' + m[1]; },
      ru: function (m) { return 'Выбрано: ' + m[1]; }
    }],
    [/^Estimate: (\$[\d,]+)$/, {
      he: function (m) { return 'הערכה: ' + m[1]; },
      ru: function (m) { return 'Оценка: ' + m[1]; }
    }],
    [/^Sending (.+)…$/, {
      he: function (m) { return 'שולח ' + m[1] + '…'; },
      ru: function (m) { return 'Отправляю ' + m[1] + '…'; }
    }],
    [/^Answer the (\d+) remaining required questions? to send the order\.$/, {
      he: function (m) { return 'ענו על ' + m[1] + ' שאלות החובה שנותרו כדי לשלוח את ההזמנה.'; },
      ru: function (m) { return 'Ответьте на оставшиеся обязательные вопросы (' + m[1] + '), чтобы отправить заказ.'; }
    }],
    [/^Brief complete — send it and we reply within one working day\.$/, {
      he: function () { return 'הבריף מלא — שלחו אותו ונחזור אליכם תוך יום עסקים אחד.'; },
      ru: function () { return 'Бриф заполнен — отправляйте, ответим в течение одного рабочего дня.'; }
    }],
    [/^Deposit to start: (.+) — the rest on delivery\. Timeline: (.+)\.$/, {
      he: function (m) { return 'מקדמה לפתיחה: ' + m[1] + ' — היתרה במסירה. לוח זמנים: ' + tt(m[2], 'he') + '.'; },
      ru: function (m) { return 'Задаток для старта: ' + m[1] + ' — остальное при сдаче. Срок: ' + tt(m[2], 'ru') + '.'; }
    }],
    [/^Package discount - (\d+)%$/, {
      he: function (m) { return 'הנחת חבילה - ' + m[1] + '%'; },
      ru: function (m) { return 'Скидка за пакет - ' + m[1] + '%'; }
    }],
    [/^Logo concept: (.+)$/, {
      he: function (m) { return 'קונספט לוגו: ' + m[1]; },
      ru: function (m) { return 'Концепция логотипа: ' + m[1]; }
    }],
    [/^(.+) care plan, monthly$/, {
      he: function (m) { return m[1] + ' — תוכנית תחזוקה, חודשי'; },
      ru: function (m) { return m[1] + ' — план поддержки, ежемесячно'; }
    }],
    // push.js, the answer code of the push service after a test
    [/^The push service answered (.+)\.$/, {
      he: function (m) { return 'שירות ההתראות ענה ' + m[1] + '.'; },
      ru: function (m) { return 'Сервис уведомлений ответил ' + m[1] + '.'; }
    }]
  ];
  var TIME = {
    '3–5 weeks': { he: 'שלושה עד חמישה שבועות', ru: 'от 3 до 5 недель' },
    '2–3 weeks': { he: 'שבועיים עד שלושה', ru: 'от 2 до 3 недель' },
    '3–7 days': { he: 'שלושה עד שבעה ימים', ru: 'от 3 до 7 дней' }
  };
  function tt(v, l) { return (TIME[v] && TIME[v][l]) || v; }

  /* 15.09.2026: two calls to action stayed English in every language. Keys for the
     languages the switch offers go into HE and RU above; the other five are kept here
     so they are ready the day the switch offers them. */
  var MORE = {
    ar: {
      'No site yet? Build one free, in minutes →': 'لا يوجد موقع بعد؟ أنشئ واحدًا مجانًا خلال دقائق ←',
      'BUILD IT AND INSTALL IT': 'ابنِه وثبّته ',
      'twelve templates, free, live in minutes, installs like an app': 'اثنا عشر قالبًا، مجانًا، جاهز خلال دقائق، يُثبَّت كتطبيق'
    },
    es: {
      'No site yet? Build one free, in minutes →': '¿Aún sin sitio? Crea uno gratis en minutos →',
      'BUILD IT AND INSTALL IT': 'CRÉALO E INSTÁLALO ',
      'twelve templates, free, live in minutes, installs like an app': 'doce plantillas, gratis, en línea en minutos, se instala como una app'
    },
    fr: {
      'No site yet? Build one free, in minutes →': 'Pas encore de site ? Créez-en un gratuitement, en quelques minutes →',
      'BUILD IT AND INSTALL IT': 'CRÉEZ-LE ET INSTALLEZ-LE ',
      'twelve templates, free, live in minutes, installs like an app': 'douze modèles, gratuit, en ligne en quelques minutes, s’installe comme une app'
    },
    de: {
      'No site yet? Build one free, in minutes →': 'Noch keine Website? Bauen Sie in Minuten kostenlos eine →',
      'BUILD IT AND INSTALL IT': 'BAUEN UND INSTALLIEREN ',
      'twelve templates, free, live in minutes, installs like an app': 'zwölf Vorlagen, kostenlos, in Minuten online, installiert wie eine App'
    },
    uk: {
      'No site yet? Build one free, in minutes →': 'Ще немає сайту? Зберіть безкоштовно за кілька хвилин →',
      'BUILD IT AND INSTALL IT': 'ЗІБРАТИ І ВСТАНОВИТИ ',
      'twelve templates, free, live in minutes, installs like an app': 'дванадцять шаблонів, безкоштовно, сайт живий за кілька хвилин, встановлюється як застосунок'
    }
  };
  var DICT = { he: HE, ru: RU, ar: MORE.ar, es: MORE.es, fr: MORE.fr, de: MORE.de, uk: MORE.uk };
  var LANGS = [['en', 'English'], ['he', 'עברית'], ['ru', 'Русский']];

  // Never touched: display type (no Hebrew or Cyrillic in those faces), the
  // assistant (it speaks the visitor's language on its own), the share menu.
  /* Names and stamps stay in one language. A tag on a card, the "live" badge, the
     watermark, the line under a big button, the legal line in the footer - these
     are labels, not sentences, and a translation either breaks the layout or, when
     the label is split by a <b>, loses the space between the halves:
     "the front one <b>plays live</b>" came back as "переднийиграет вживую". */
  /* Names are never translated: the four sections, the slogan, the rubrics on the
     cards, the works, the templates and the logo concepts, the section names of the
     order form, the logo mock-ups with their running lines, the brand and the man.
     Everything that explains or tells the visitor what to do is translated, caps
     or not. */
  /* The header and the footer are a stamp, not a text. The line under the wordmark
     crosses it - white GENVID over the fiery craft, fiery PRO over the white name -
     and a longer translation moved that crossing off and pushed the line out of the
     width it was fitted to. The footer is the legal line: terms, privacy, the city.
     Both stay in English in every language: same width, same place, always. */
  var SKIP_SEL = '#gvtop .gv-ai,#gvtop .gv-by,footer,#gvtop .gv-slogan,#gvtop .gv-nme,#gvtop .gv-l,#gvbot .gv-l,' +
    '#gvtop .gv-hp .gv-w,#gvtop .gv-tg,#gvtop .gv-nm,.gv-wm,.gv-tn b,#lbT,' +
    '.brand,#deep .sec-head h2,#deep .lab .num,.hx-h,#lb h4,.gv-bc,.badge,.tc,#help,#shr-menu,#lang-menu,.opt .pr,#total,#stick-total,' +
    '.card .ti,.card .ar,.card .yr,.card .src,#lbxCap,.chip b,.upi .nm,.gvpa,' +
    /* the three screens write their own words in the page language, and redraw them on a switch */
    '#gv3 .gv3-lab,#gv3go,#gv3msg,#gv3tabs,#gv3s,#gv3facts,#gv3verdict,' +
    /* the fixed bar and the fixed legal line gv-chrome.js builds on every page: the studio's
       name, what it is and the way back are the same words in every language (16.09.2026) */
    '#gvc-bar,#gvc-foot';
  var SKIP_TAG = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION|IFRAME|VIDEO|CANVAS)$/;

  var cur = 'en';
  try { cur = localStorage.getItem('gvlang') || 'en'; } catch (e) {}
  /* 16.09.2026, Roma: TERMS and PRIVACY opened from the GVPro app came up in Hebrew while the
     app itself was in English. The app lives on app.genvidpro.com, a different address with its
     own memory, so the language chosen there never reached this one. Now the link carries it:
     ?lang=xx wins over what this address remembers, and is remembered here from then on. */
  try {
    var q = /[?&#]lang=([a-z-]{2,5})/i.exec(location.search + location.hash);
    if (q) {
      var want = q[1].toLowerCase();
      if (want === 'en' || DICT[want]) { cur = want; localStorage.setItem('gvlang', cur); }
    }
  } catch (e) {}
  if (cur !== 'en' && !DICT[cur]) cur = 'en';
  /* 15.09.2026: Hebrew was shown with lang="he" and dir="ltr", on a studio that sells
     fixing exactly that. The page direction follows the language, set before the page
     paints so a Hebrew visitor never sees it flip. */
  function isRtl(l) { return l === 'he' || l === 'ar'; }
  document.documentElement.setAttribute('dir', isRtl(cur) ? 'rtl' : 'ltr');
  if (cur !== 'en') document.documentElement.setAttribute('lang', cur);

  function translate(s, lang) {
    var d = DICT[lang];
    if (d && d[s] !== undefined) return d[s];
    for (var i = 0; i < PAT.length; i++) {
      var m = s.match(PAT[i][0]);
      if (m && PAT[i][1][lang]) return PAT[i][1][lang](m);
    }
    return null;
  }

  /* Every node keeps its English original, so switching back is exact and the
     order that reaches Roman is always written in English. */
  function walk(lang) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    var touched = [];
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (!p || SKIP_TAG.test(p.tagName)) continue;
      var raw = n.nodeValue;
      if (!raw || !raw.trim()) continue;
      var en = n.__gvEn !== undefined ? n.__gvEn : raw.trim().replace(/\s+/g, ' ');
      if (p.closest(SKIP_SEL)) continue;
      var out = lang === 'en' ? null : translate(en, lang);
      if (out === null && n.__gvEn === undefined) continue;   // nothing to do, never was
      if (n.__gvEn === undefined) n.__gvEn = en;
      if (p.dataset && !p.dataset.en) { try { p.dataset.en = en; } catch (e) {} }
      n.nodeValue = out === null ? n.__gvEn : out;
      touched.push(p);
    }
    return touched;
  }

  /* Hebrew: turn each translated block round on its own. The page frame stays
     left-to-right - mirroring the whole layout is what breaks these designs -
     but a right-aligned block becomes right-aligned in Hebrew, a centred one
     stays centred, and the type is Heebo rather than whatever the system has. */
  function direction(nodes, lang) {
    nodes.forEach(function (el) {
      if (lang !== 'he') { el.style.direction = ''; el.style.textAlign = el.__gvAl || ''; return; }
      var al = getComputedStyle(el).textAlign;
      if (el.__gvAl === undefined) el.__gvAl = el.style.textAlign || '';
      el.style.direction = 'rtl';
      if (al === 'left' || al === 'start') el.style.textAlign = 'right';
    });
  }

  function apply(lang) {
    cur = lang;
    try { localStorage.setItem('gvlang', lang); } catch (e) {}
    var touched = walk(lang);
    direction(touched, lang);
    document.documentElement.classList.toggle('gv-he', lang === 'he');
    document.documentElement.classList.toggle('gv-ru', lang === 'ru');
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRtl(lang) ? 'rtl' : 'ltr');
    /* The fields the visitor writes in. Hebrew starts from the right, so the
       caret, the prompt inside the box and the text all begin on the right;
       English and Russian follow whatever is typed. An address field stays left to
       right in every language: a web address is Latin whatever the page says. */
    document.querySelectorAll('#brief input, #brief textarea, .finp, input[placeholder], textarea[placeholder]').forEach(function (i) {
      if (i.dataset.ph === undefined) i.dataset.ph = i.getAttribute('placeholder') || '';
      var ph = lang === 'en' ? null : translate(i.dataset.ph, lang);
      if (i.dataset.ph) i.setAttribute('placeholder', ph || i.dataset.ph);
      if (i.type === 'url') { i.setAttribute('dir', 'ltr'); return; }
      i.setAttribute('dir', isRtl(lang) ? 'rtl' : 'auto');
      i.style.textAlign = isRtl(lang) ? 'right' : '';
    });
    isolateLatin(lang);
    /* anything that writes its own words (the three screens, the assistant) redraws */
    try { document.dispatchEvent(new CustomEvent('gvlang', { detail: { lang: lang } })); } catch (e) {}
    /* the header lines are scaled to the width they measure; a translation changes
       that width, so the page re-fits them after every switch */
    if (window.gvFit) try { window.gvFit(); } catch (e) {}
    var b = document.getElementById('lang');
    if (b) b.setAttribute('data-l', lang.toUpperCase());
    document.querySelectorAll('#lang-menu button').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x.dataset.l === lang));
    });
  }
  /* In a right-to-left page, a line left in English (a name, a label, a sentence with
     no translation yet) is laid out left to right on its own. Without this "Every take
     is mine, until the thing looks right." came out as ".mine, until the thing looks
     right" and "5 stages" as "stages 5". Only elements with no Hebrew or Arabic in
     them are touched, and the mark is taken off again on every switch. */
  var RTL_CH = /[֐-׿؀-ۿ]/;
  function isolateLatin(lang) {
    document.querySelectorAll('[data-gvltr]').forEach(function (el) { el.removeAttribute('dir'); el.removeAttribute('data-gvltr'); });
    if (!isRtl(lang) || !document.body) return;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, seen = [];
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (!p || SKIP_TAG.test(p.tagName) || p.hasAttribute('dir') || seen.indexOf(p) !== -1) continue;
      if (!/[A-Za-z]/.test(n.nodeValue)) continue;
      if (p.closest('#gv3s,.gvpa-log,#help-log,input,[contenteditable]')) continue;
      seen.push(p);
      if (RTL_CH.test(p.textContent)) continue;
      p.setAttribute('dir', 'ltr'); p.setAttribute('data-gvltr', '1');
    }
  }
  window.gvT = function () { if (cur !== 'en') { direction(walk(cur), cur); } isolateLatin(cur); };
  window.gvLang = function () { return cur; };

  // ---- the globe, next to Share ---------------------------------------------
  var css = document.createElement('style');
  css.textContent =
    '.lang{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;' +
    'width:46px;height:32px;padding:0;background:none;border:1px solid rgba(255,74,28,.85);' +
    'color:#fff;border-radius:999px;cursor:pointer;font-family:inherit;' +
    'box-shadow:0 0 9px rgba(255,74,28,.55),inset 0 0 10px rgba(255,74,28,.12);' +
    'transition:box-shadow .25s,color .25s,border-color .25s;-webkit-tap-highlight-color:transparent}' +
    '.lang svg{width:16px;height:16px;display:block;fill:none;stroke:currentColor;stroke-width:1.7;' +
    'filter:drop-shadow(0 0 5px rgba(255,74,28,.85))}' +
    '.lang:hover,.lang[aria-expanded="true"]{border-color:#FF7A4C;color:#FF4A1C;' +
    'box-shadow:0 0 16px rgba(255,74,28,.95),0 0 40px rgba(255,74,28,.5),inset 0 0 14px rgba(255,74,28,.2)}' +
    '@media(max-width:640px){.lang{width:42px;height:30px}}' +
    '#lang-menu{position:fixed;z-index:70;min-width:150px;padding:6px;' +
    'background:rgba(14,13,12,.96);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
    'border:1px solid rgba(255,74,28,.6);border-radius:16px;' +
    'box-shadow:0 0 14px rgba(255,74,28,.35),0 22px 50px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:2px}' +
    '#lang-menu[hidden]{display:none}' +
    '#lang-menu button{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;' +
    'background:none;border:0;color:#F2EFEA;font-family:inherit;font-size:14px;text-align:left;cursor:pointer}' +
    '#lang-menu button:hover{background:rgba(255,74,28,.16);color:#fff}' +
    '#lang-menu button[aria-pressed="true"]{color:#FF4A1C}' +
    '#lang-menu i{width:16px;font-style:normal;color:#FF4A1C}' +
    // Hebrew needs a face that actually has Hebrew in it, and a little more line
    // height than the Latin copy or it reads cramped.
    'html.gv-he [data-en]{font-family:"Heebo","Noto Sans Hebrew","Arial Hebrew",Arial,sans-serif;line-height:1.65}' +
    'html.gv-he .opt{padding-left:16px}' +
    'html.gv-he .bqt b{margin-left:7px}html.gv-he .bqt .star{margin-right:5px}' +
    'html.gv-he .chips,html.gv-he .cats{direction:rtl}html.gv-he .chip,html.gv-he .cat{direction:rtl}';
  document.head.appendChild(css);

  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap';
  document.head.appendChild(font);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lang';
  btn.id = 'lang';
  btn.setAttribute('aria-label', 'Language');
  btn.setAttribute('aria-expanded', 'false');
  btn.title = 'Language · שפה · Язык';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/>' +
    '<path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>';

  var menu = document.createElement('div');
  menu.id = 'lang-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  menu.innerHTML = LANGS.map(function (l) {
    return '<button type="button" data-l="' + l[0] + '" role="menuitem" aria-pressed="false">' +
      '<i>' + l[0].toUpperCase() + '</i>' + l[1] + '</button>';
  }).join('');

  function place() {
    var r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 8) + 'px';
    menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
  }
  function open(o) { menu.hidden = !o; btn.setAttribute('aria-expanded', String(o)); if (o) place(); }

  btn.addEventListener('click', function (e) { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    apply(b.dataset.l);
    open(false);
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  addEventListener('resize', function () { if (!menu.hidden) place(); });

  function mount() {
    var share = document.getElementById('shr');
    if (share && share.parentNode) {
      // the builder pins its share button; the globe sits just left of it
      if (getComputedStyle(share).position === 'fixed') {
        var r = share.getBoundingClientRect();
        btn.style.position = 'fixed';
        btn.style.top = r.top + 'px';
        btn.style.right = (window.innerWidth - r.left + 8) + 'px';
        btn.style.zIndex = '60';
        document.body.appendChild(btn);
      } else {
        share.parentNode.insertBefore(btn, share);
      }
    } else {
      btn.style.position = 'fixed';
      btn.style.top = '14px';
      btn.style.right = '14px';
      btn.style.zIndex = '60';
      document.body.appendChild(btn);
    }
    document.body.appendChild(menu);
    if (cur !== 'en') apply(cur); else apply('en');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
