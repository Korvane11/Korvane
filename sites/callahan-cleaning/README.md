# Callahan Cleaning website

A new site for Callahan Cleaning, a cleaning company in Tucson, Arizona
(homes, offices, move-ins and move-outs, Airbnb and vacation rentals). Built
2026-10-14 from their Wix site
(https://callahancleaning74.wixsite.com/website), their Facebook page
(https://www.facebook.com/callahancleaning) and their Yelp listing (read
through MapQuest, which shows it; Yelp itself refuses this container).

The Korvane owner's brief, word for word: "create a website using all the
plugins and skills to the best of your ability, make this professional,
realisitic, artistic, and unique to the business, pull info from their
socials, google, website, make this cinematic and use only real 3d rendering .
use high quality images and videos, make sure everything meets the standard of
a premium website".

Not yet approved by Callahan Cleaning: every page carries
`<meta name="robots" content="noindex">` so search engines don't list it next
to their real site. Remove it at launch.

## Run it locally

```bash
cd sites/callahan-cleaning
python3 -m http.server 8000
# open http://localhost:8000
```

`?skip` skips the opening on the home page, `?intro` plays it even if it
already played this visit.

## Facts and where each one came from

Read directly on 2026-10-14.

| Fact | Source |
| --- | --- |
| Name: Callahan Cleaning. Line: "Where Quality Meets Clean" (their logo, site footer) | Wix site, Facebook logo |
| Second line: "Quality. Value. Peace of Mind." | Their logo card on Facebook |
| Phone (call or text): (520) 448-6169 | Wix site, Facebook, every graphic |
| Email: callahan.cleaning74@gmail.com (Facebook contact info, Wix footer and contact section); kelsey@callahancleaning.org (Wix header, their logo and "Licensed, Bonded & Insured" graphics) | Wix, Facebook |
| Since 2017 ("Since 2017, we've been committed...", "©2017") | Wix site |
| "Locally owned and LGBTQ+ operated"; "Proudly LGBTQ+ owned" | Wix footer, Facebook graphic |
| "Licensed, Bonded & Insured" | Facebook graphic (with Kelsey's email) |
| Services: residential, commercial, office (Wix); regular, deep, move-in/move-out, Airbnb (Facebook "Services" graphic); "Commercial/Offices/Move in-out/ Etc.", "Weekly/Bi-weekly/Monthly/One-time" (their card); "home, office, or AirBnB/ vacation rental" (Yelp) | Wix, Facebook, Yelp |
| Standard upkeep cleaning: dusting surfaces (furniture, shelves, décor); vacuuming and mopping floors; wiping down countertops and outside of appliances; cleaning bathrooms (toilets, sinks, mirrors, and showers/tubs); taking out the trash; light tidying | Facebook graphic "Standard Upkeep Cleaning" |
| Deep cleaning: "a more detailed service that tackles areas often missed during regular cleanings. It includes everything in a standard clean, plus..." (the rest of the list is cut off at the size Facebook serves logged out) | Same graphic |
| "Serving busy professionals & families in Tucson. Let us give you the fresh start you deserve." | Facebook graphic |
| "The cleaning company that makes you and your house feel like a million dollars again" | Facebook post, 3 October |
| "Callahan Cleaning offers professional, reliable cleaning services with care. We specialize in creating clean, safe, and comfortable homes, so you can relax and enjoy life." | Facebook intro |
| Reviews: Facebook "100% recommend (5 reviews)"; Elda Suarez, 5 December 2024 (text kept word for word); Payton Hillman on their site (kept word for word) | Facebook, Wix |
| Price range "$" | Facebook |
| Hours: Mon-Fri 7 am-6 pm, Sat 8 am-5 pm, Sun 8 am-3 pm | Yelp (owner-claimed listing, shown on MapQuest) |
| Hiring: full and part-time, flexible daytime hours, weekly pay, training provided; apply by text to (520) 448-6169 | Facebook "Now hiring" graphics |
| Gift cards ("the gift of a clean home") | Facebook graphic |
| Instagram: @callahancleaning | Facebook contact info |
| Their own domain callahancleaning.org exists (a Squarespace "Coming soon" page) | Fetched directly |
| Area: Tucson, AZ (Facebook lists 85710, MapQuest 85745; they're mobile) | Facebook, MapQuest |

## Gaps and questions for Callahan Cleaning

- **Which email should the forms go to?** This site sends quote requests to
  callahan.cleaning74@gmail.com (the address on Facebook and in their site's
  contact section) and shows kelsey@callahancleaning.org nowhere. Swap it in
  `book.html` if Kelsey's is the one they read.
- **Hours.** Only Yelp lists them. Confirm.
- **Deep cleaning list.** The rest of their "Deep Cleaning" list ("...plus:")
  wasn't readable. The site says what they said and no more.
- **Prices.** None are published (Facebook says "$"). The site offers a free
  quote.
- **Spanish.** Their business card ends in "...ñol" (probably "Español").
  Not claimed on the site until they confirm.
- **Service area.** Tucson is all they say. Which neighbourhoods and towns?
- **Kelsey.** Named only in the email address; Yelp lists "Kelsey C." as
  the business owner. The site doesn't name an owner until they say how.
- **Photos.** Their before-and-after photos on Facebook are small (206 px
  logged out); the originals would make a strong "results" section.
- **Their domain.** callahancleaning.org is waiting on Squarespace: this site
  could launch there.

### What their site had that this one doesn't

- **Online booking.** Their "Book Online" page says "Nothing to book right
  now. Check back soon." This site replaces it with a quote request form
  (it opens the visitor's email app with everything filled in) and call or
  text buttons.
- **Their photos.** The bedroom, bathroom and cleaning-cart photos on their
  Wix site are Wix's free media library (licensed for Wix sites only). Not
  reused. Every image here is rendered in 3D (see The 3D renders).
- **The Wix contact form's "Address" and "Subject" fields** are folded into
  the quote form (area or ZIP, service).

## Design note

1. **The moment:** the site opens on a dark room in Tucson with the blinds
   closed. The blinds tilt open, low morning sun comes through them in
   stripes across a Saltillo tile floor, a linen sofa and a rug, and their
   three sparkles light up one by one over the logo. Their own words are
   "the fresh start you deserve": that is what it shows, in the light of
   the place they work. It is rendered in 3D (Blender, Cycles), not filmed
   and not stock.
2. **What stays quiet:** a calm, light page under it. One colour (their
   teal), type and hairlines, generous space, and the renders. The only
   other motion is things easing in as they scroll into view and the
   services' render changing as you move down the list.
3. **Colour:** their teal `#0c454c` (measured on their logo) for buttons,
   links and the logo; teal-black `#0f1d1e` for text; a limewash white
   `#efeeea` for the page; deep teal `#082f34` for the footer band. The
   warm colours (sun, Saltillo, oak) live only in the renders.
4. **Type:** Outfit for headings (a geometric sans with round bowls, close to
   the "Cleaning" in their logo), DM Sans for everything else. Both OFL,
   self-hosted. Their script "Callahan" stays in the logo only.
5. **Motion:** the opening (about 5 s, once per visit), then the loop (the
   leaves outside sway, so the stripes of light move a little). Fades of
   0.7 s, ease-out. Nothing moves for decoration.
6. **Images:** one house, one morning: every render is a room of the same
   Tucson home (plaster, tile, vigas, a tall window, the same sun), so the
   set reads as one shoot.
7. **Phones:** the opening is rendered again in portrait (not cropped);
   the nav folds into a full-screen menu; a call and text bar stays at the
   bottom.

## Pages

| Page | Purpose | Main action |
| --- | --- | --- |
| `index.html` | The opening, who they are, the five services, how it works, reviews, why them, book | Get a free quote |
| `services.html` | Each service with its render, what standard and deep cleans include, how often | Get a free quote |
| `about.html` | Since 2017, locally owned, LGBTQ+ owned and operated, licensed, bonded and insured, reviews, hiring | Get a free quote |
| `book.html` | The quote form (email), call, text, hours, gift cards | Send request |
