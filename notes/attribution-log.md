# Журнал правок авторства

Что переехало между композиторами и почему. Сами правки уже стоят в
`data/musical-cosmos-sheet.xlsx` — это не запасная таблица, а память: без
неё через полгода не понять, почему «Гробница Куперена» числится за
Равелем, а не за Купереном.

Вписаны инструментом `tools/fix-sheet.py`. Он читает очередь из
`tools/extract/attrib.tsv`, ставит композитора и полный ярлык эпохи прямо
в лист Classical и, если записи там не было вовсе, заводит ей строку.

Как ловилось: чужой каталожный номер в названии (BWV, Wq., HWV, RV, RCT,
D., Hob., GWV), опус, которого у автора нет, и — надёжнее всего — название
альбома. Спорное сюда не попало, оно в `attribution-open.md`.

| стало | числилось за | произведения |
|---|---|---|
| **Карл Филипп Эмануэль Бах** | Иоганн Себастьян Бах | 2 Clavier-Sonaten, 2 Fantasien und 2 Rondos für Kenner und Liebhaber, Wq. 59; Keyboard Sonata in A Major, Wq. 55/4, H. 186; Piano Concerto in A Minor, Wq. 26; Piano Concerto in C Minor, Wq. 31; Piano Concerto in D Minor, Wq. 22; Piano Concerto in D Minor, Wq. 23; Sinfonia in B Minor, H. 661, Wq. 182/5; Sonata in A Major, Wq. 55/4 (H.186); Sonata in A Minor, H. 247; Sonata in C Minor, Wq.65/31; Sonata in C minor Wq 60 allegretto; Sonata in E Minor, H. 66; Sonata in F-Sharp Minor, Wq. 52/4 (H.37); Symphony in D Major, H. 663; Symphony in E Minor, Wq. 178; Württemberg Sonatas: Sonata No. 6 in B Minor, H. 36 |
| **Астор Пьяццолла** | Антонио Вивальди | Invierno Porteno; Otono Porteno; Primavera Portena; Verano Porteno |
| **Иоганн Кристиан Бах** | Иоганн Себастьян Бах | Keyboard Sonata in C Minor, Op. 17, No. 2; Sonata No. 2 in D Major, Op. 5; Sonata for 2 Keyboards in G Major, Op. 15 No. 5, W. A21; Symphony in G Minor, Op. 6, No. 6 |
| **Николай Метнер** | Сергей Рахманинов | Fairy Tale in F Minor, Op. 42, No. 1; Forgotten Melodies I, Op. 38; Piano Concerto No. 2 in C Minor, Op. 50; Piano Concerto No. 2 in C Minor, Op. 50: III. Divertimento |
| **Габриэль Прокофьев** | Сергей Прокофьев | Clock Watt; Concerto for Turntables No. 1; Tough Moves |
| **Сезар Франк** | Иоганн Себастьян Бах | Prelude, Fugue and Variation In B Minor, Op. 18 (Tr. Bauer, Viardo) - I. Prelude; Prelude, Fugue and Variation In B Minor, Op. 18 (Tr. Bauer, Viardo) - II. Fugue; Prelude, Fugue and Variation In B Minor, Op. 18 (Tr. Bauer, Viardo) - III. Variation |
| **Уильям Гиллок** | Арво Пярт | Goldfish; Jazz Prelude; Journey in the Night |
| **Жан-Филипп Рамо** | Людвиг ван Бетховен | Nouvelles suites de pièces de clavecin / Suite in G Major; Premier livre de pieces de clavecin / Suite in D Minor-Major |
| **Клод Дебюсси** | Морис Равель | Nocturnes, L. 91 (Transcr. Ravel); Pour le piano |
| **Клод Дебюсси** | Вольфганг Амадей Моцарт | Beau soir; En blanc et noir, L. 134 |
| **Морис Равель** | Франсуа Куперен | Le tombe de Couperin; Le tombeau de Couperin |
| **Морис Равель** | Клод Дебюсси | La Valse (Poème Chorégraphique); Valses nobles et sentimentales, M. 61 |
| **Роберт Шуман** | Фридерик Шопен | Carnaval, Op. 9; Piano Concerto in A Minor, Op. 54 |
| **Сергей Прокофьев** | Фридерик Шопен | 10 Pieces for Piano, Op. 12; Tales of an Old Grandmother, Op. 31 |
| **Ференц Лист** | Фридерик Шопен | 12 Etudes D'exécution Transcendante, S. 139; Piano Concert No. 2 In A Major |
| **Франц Шуберт** | Людвиг ван Бетховен | 3 Klavierstücke, D.946; 4 Impromptus, Op. 90, D.899 |
| **Франц Шуберт** | Бенджамин Бриттен | Fantasy in F Minor, D. 940; Grand Duo Sonata in C Major, D.812 |
| **Александр Бородин** | Ференц Лист | Petite Suite |
| **Александр Мосолов** | Альфред Шнитке | String Quartet No. 1, Op. 24 |
| **Александр Рабинович-Бараковский** | Арво Пярт | Pourquoi je suis si sentimental |
| **Александр Скрябин** | Доменико Скарлатти | Prelude for Left Hand, Op. 9, No. 1 |
| **Александр Скрябин** | Людвиг ван Бетховен | Piano Sonata No. 3 in F-Sharp Minor, Op. 23 |
| **Александр Скрябин** | Сергей Рахманинов | 24 Preludes, Op. 11 |
| **Александр Скрябин** | Фридерик Шопен | Op.8 No.11 |
| **Альфред Шнитке** | Франсис Пуленк | Suite in the Old Style |
| **Альфред Шнитке** | Ян Сибелиус | Concerto grosso No. 1 (1976-77) |
| **Антонио Вивальди** | Георг Фридрих Гендель | Dixit Dominus, RV 595 |
| **Антонио Солер** | Доменико Скарлатти | Fandango in D Minor |
| **Арво Пярт** | Мечислав Вайнберг | Fratres |
| **Арнольд Шёнберг** | Густав Малер | String Trio, Op. 45 |
| **Артюр Онеггер** | Морис Равель | Concertino for Piano & Orchestra |
| **Бальдассаре Галуппи** | Вольфганг Амадей Моцарт | Piano Sonata No. 9 in F Minor |
| **Бенджамин Бриттен** | Жорж Бизе | Simple Symphony, Op. 4 |
| **Виктор Кисине** | Пётр Ильич Чайковский | Zerkalo |
| **Владимир Мартынов** | Франц Шуберт | Schubert-Quintet (Unfinished) |
| **Вольфганг Амадей Моцарт** | Доменико Скарлатти | 12 Variations on "Ah, Vous Dirai - Je Maman", K. 265 |
| **Вольфганг Амадей Моцарт** | Иоганн Себастьян Бах | The Magic Flute - Overture |
| **Вольфганг Амадей Моцарт** | Людвиг ван Бетховен | Piano Concerto No. 20 in D Minor, K. 466 |
| **Генрих Шютц** | Иоганнес Брамс | Symphoniarum sacrarum III, Op. 12 |
| **Георг Фридрих Гендель** | Иоганн Себастьян Бах | Keyboard Suite in D Minor, HWV 437 |
| **Георгий Свиридов** | Пётр Ильич Чайковский | The Snowstorm |
| **Джон Адамс** | Иоганн Себастьян Бах | Shaker Loops |
| **Джон Адамс** | Игорь Стравинский | Hallelujah Junction |
| **Джон Кейдж** | Доменико Скарлатти | Sonatas and Interludes |
| **Джон Филд** | Фридерик Шопен | Nocturne in C Minor, H. 25 |
| **Джордже Энеску** | Феликс Мендельсон | Octet in C Major, Op. 7 |
| **Дмитрий Кабалевский** | Игорь Стравинский | Piano Concerto No. 2 in G Minor, Op. 23 |
| **Дмитрий Шостакович** | Иоганн Себастьян Бах | Piano Sonata No. 2 in B Minor, Op. 61 |
| **Дмитрий Шостакович** | Вольфганг Амадей Моцарт | Three Fantastic Dances, Op. 5 |
| **Дьёрдь Лигети** | Арканджело Корелли | Devil’s Staircase |
| **Дьёрдь Лигети** | Доменико Скарлатти | Hungarian Rock |
| **Дьёрдь Лигети** | Оливье Мессиан | From "Musica Ricercata" |
| **Жан-Фери Ребель** | Франсуа Куперен | Les Éléments, simphonie nouvelle (1737) |
| **Жан-Филипп Рамо** | Иоганн Себастьян Бах | Pièces de clavecin avec une méthode (1724), Suite in E Minor, RCT 2 |
| **Жан-Филипп Рамо** | Вольфганг Амадей Моцарт | Suite in E Minor, RCT 2 |
| **Игорь Стравинский** | Морис Равель | The Rite of Spring, K015, Part I, Adoration of the Earth |
| **Игорь Стравинский** | Эрик Сати | Concerto in E-Flat Major "Dumbarton Oaks" |
| **Игорь Стравинский** | Пётр Ильич Чайковский | Les noces |
| **Иоганн Себастьян Бах** | Сергей Рахманинов | Violin Partita No. 3 in E Major, BWV 1006 |
| **Иоганн Себастьян Бах** | Иоганнес Брамс | 6 Chorale Preludes, BV B 50 |
| **Иоганн Себастьян Бах** | Георг Фридрих Гендель | Suite No. 2 in B Minor, BWV 1067 - Arr. Piano |
| **Иоганнес Брамс** | Георг Фридрих Гендель | Sonata No. 3 in D Minor, Op. 108 |
| **Иоганнес Брамс** | Иоганн Себастьян Бах | 8 Klavierstücke, Op. 76 |
| **Иоганнес Брамс** | Людвиг ван Бетховен | Violin Concerto in D Major, Op. 77 |
| **Иоганнес Брамс** | Никколо Паганини | Variations on a Theme of Paganini in A Minor, Op. 35 |
| **Исаак Альбенис** | Иоганн Себастьян Бах | Suite española No. 1, Op. 47 |
| **Йоханнес Окегем** | Арво Пярт | Deo gratis (Thirty-six-part canon) |
| **Камиль Сен-Санс** | Фридерик Шопен | Introducao e rondo Caprichoso para violino e orquestra em la menor, Op. 28 (feat. Klaus Arp) |
| **Карл Мария фон Вебер** | Георг Фридрих Гендель | Clarinet Concerto No. 1 in F Minor, Op. 73 |
| **Карл Мария фон Вебер** | Ференц Лист | Konzertstück in F Minor, Op. 79 |
| **Карл Нильсен** | записи не было на листе | Concerto for Violin and Orchestra in G Majpr, Op. 33 |
| **Карл Филипп Эмануэль Бах** | Вольфганг Амадей Моцарт | Rondo II in D Minor, H. 290 |
| **Карл Филипп Эмануэль Бах** | Ференц Лист | Keyboard Sonata in B Minor, Wq. 55/3, H. 245 |
| **Клод Дебюсси** | Сергей Рахманинов | Children's Corner, L. 113 |
| **Кнут Нюстедт** | Иоганн Себастьян Бах | Immortal Bach, Op. 153 |
| **Колин Макфи** | Игорь Стравинский | Balinese Ceremonial Music |
| **Кристоф Виллибальд Глюк** | Фридерик Шопен | Orfeo ed Euridice |
| **Кристоф Граупнер** | Иоганн Себастьян Бах | Suite in E Minor, GWV 829 |
| **Кшиштоф Мейер** | Дмитрий Шостакович | Sonata No. 1 for Cello & Piano, Op. 62 |
| **Леопольд Годовский** | Фридерик Шопен | 53 Studies on the Chopin Études (Excerpts) |
| **Людвиг ван Бетховен** | Йозеф Гайдн | Piano Trio No. 1 in E-Flat Major, Op. 1 No. 1 |
| **Людвиг ван Бетховен** | Сергей Рахманинов | 32 Variations in C Minor, WoO 80 |
| **Мечислав Вайнберг** | Дмитрий Шостакович | Fantasy for Cello & Orchestra Op. 52 |
| **Михаил Глинка** | Александр Скрябин | Glinka - A Farewell to St Petersburg |
| **Модест Мусоргский** | Сергей Прокофьев | Pictures at an Exhibition |
| **Морис Равель** | Йозеф Гайдн | Menuet Sur Le Nom de Haydn |
| **Морис Равель** | Сергей Рахманинов | Concerto for Piano and Orchestra in G Major |
| **Морис Равель** | Роберт Шуман | Miroirs |
| **Морис Равель** | Сезар Франк | Piano Trio A Minor, M. 67 |
| **Морис Равель** | Фридерик Шопен | Gaspard de la nuit |
| **Морис Равель** | Эдвард Григ | Miroirs, M. 43 |
| **Муцио Клементи** | Вольфганг Амадей Моцарт | Piano Sonata in G Minor, Op. 50 No. 3 "Didone abbandonata - Scene tragiche" |
| **Муцио Клементи** | Ян Ладислав Душек | Piano Sonata in B-Flat Major, Op. 24 No. 2 |
| **Освальдо Голихов** | Игорь Стравинский | Nazareno (Arr. for Two Pianos and Orchestra by Gonzalo Grau) |
| **Отторино Респиги** | Оливье Мессиан | From "Three Preludes On Gregorian Melodies" |
| **Патрик Гауэрс** | Доменико Скарлатти | Chamber Concerto for Guitar |
| **Пауль Хиндемит** | Бела Барток | String Quartet No. 4, Op. 22 |
| **Пётр Ильич Чайковский** | Сергей Рахманинов | 6 Morceaux, Op. 19 |
| **Роберт Шуман** | Франц Шуберт | Sonate In G-Moll, Op. 22 |
| **Сергей Прокофьев** | Вольфганг Амадей Моцарт | Sarcasms, Op. 17 |
| **Сергей Прокофьев** | Сергей Рахманинов | Suggestion Diabolique, Op. 4, No. 4 |
| **Сергей Прокофьев** | Пётр Ильич Чайковский | Piano Concerto No. 3 in C, Op. 26 |
| **Сергей Рахманинов** | Арканджело Корелли | Variations On a Theme of Corelli, Op. 42 |
| **Сергей Рахманинов** | Вольфганг Амадей Моцарт | Piano Concerto No. 3 in D Minor, Op. 30 |
| **Сергей Рахманинов** | Модест Мусоргский | Humoresque, Op. 10 No. 5 |
| **Сергей Рахманинов** | Фридерик Шопен | Cello Sonata in G Minor, Op. 19 |
| **Томазо Антонио Витали** | Франсис Пуленк | Chaconne In G Minor For Violin And Organ |
| **Феликс Мендельсон** | Иоганн Себастьян Бах | Prelude & Fugue in E Minor, Op. 35 No. 1 |
| **Феликс Мендельсон** | Людвиг ван Бетховен | Violin Concerto in E Minor, Op. 64 |
| **Феликс Мендельсон** | Сергей Рахманинов | A Midsummer Night's Dream, Op. 61 |
| **Феликс Мендельсон** | Антонио Вивальди | Double Concerto for Piano, Violin and Strings in D Minor, MWV O 4 |
| **Ференц Лист** | Йозеф Гайдн | Tristia, S. 378a |
| **Ференц Лист** | Иоганнес Брамс | Mephisto Waltz No. 1, S. 514 |
| **Ференц Лист** | Никколо Паганини | La campanella in G-Sharp Minor (From "Grandes études de Paganini", S. 141 / 3) |
| **Ферруччо Бузони** | Иоганн Себастьян Бах | Fantasia after J. S. Bach, BV 253 |
| **Филип Гласс** | Иоганн Себастьян Бах | Mad Rush |
| **Франц Шуберт** | Доменико Скарлатти | 34 Valses sentimentales, Op. 50, D. 779 (Excerpts Arr. W. Landowska for Piano) |
| **Франц Шуберт** | Иоганн Себастьян Бах | Serenade (Ständchen) After Franz Schubert |
| **Франц Шуберт** | Иоганнес Брамс | Schwanengesang, S. 560 |
| **Фредерик Ржевски** | Игорь Стравинский | Winnsboro Cotton Mill Blues |
| **Фридерик Шопен** | Иоганн Себастьян Бах | 12 Etudes, Op. 25 |
| **Фридрих Калькбреннер** | Иоганн Непомук Гуммель | Piano Concerto No. 1 in D Minor, Op. 61 |
| **Эдвард Григ** | Феликс Мендельсон | Lyrical Pieces, Op. 54 |
| **Эдвард Григ** | Ференц Лист | Piano Concerto in A Minor, Op. 16 |
| **Эдвард Григ** | Фридерик Шопен | Stimmungen, Op. 73 |
| **Энрике Гранадос** | Иоганн Себастьян Бах | 12 Danzas españolas |
| **Эрнест Шоссон** | Камиль Сен-Санс | Poème, Op. 25 |

Всего переехало **277** записей, композиторов в библиотеке стало на **23** больше.
