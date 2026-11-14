# Team call, Sat 14 Nov 2026: demo flow, UI fixes and presentation concept

Fathom transcript of the team call (35 minutes, in Polish), saved verbatim from the Fathom export. Recording: <https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5>.

It is an automatic transcript: some words are misheard (for example "IO-a" is Iowa) and some sentences are cut. Nothing was corrected. The "ACTION ITEM" lines are Fathom's own summary lines, with a link to the moment in the recording.

---

Nasa Hackaton - November 14
VIEW RECORDING - 35 mins (No highlights): https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5

---

0:02 - Wojciech Rudnicki (UAM Poznań)
  Dobra, i teraz to jeszcze u siebie puściłem, puściłem już, żeby u mnie rzeczy kończył i poprawki robił. Ty, Oskar, co dodałeś do handoffa?

0:16 - Oskar Pelzer
  No to, żeby poprawił słowniczek na polski, bo jak włączysz wersję polską, no to masz po angielsku go. No, masz nawet, to jest pierwszy branch.  A to 19 już się poprawia? Nie, jeszcze nie.

0:37 - Wojciech Rudnicki (UAM Poznań)
  Dopiero usiadam na compa, Okej, to też trzeba puścić. A to są moje rzeczy akurat.

0:43 - Oskar Pelzer
  nie, ale to ty musisz puścić. A nie, dobra, jest handoff do tego, sorry, sorry.
  ACTION ITEM: Refactor onboarding: add intro; swap steps 1↔2; set country/region default; add 'Find address/place' only - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=44.9999

0:48 - Wojciech Rudnicki (UAM Poznań)
  Dlatego robiliśmy na reponia, żebyś ty mógł puścić. Dobra, i wracając do tego ekranu, to pierwsza rzecz, która myślę jest do poprawy.  Wybór języka. Dobra, wybór języka jest, ale nie wiem, jakieś intro, musi być jakieś lepsze, nie? No.

1:11 - Mateusz Wojciechowski
  A nie, że od razu na start.

1:13 - Wojciech Rudnicki (UAM Poznań)
  Nie wiem, że wybór języka i regionu na przykład, czy coś takiego w ten sposób, nie? Jeszcze jakieś wprowadzenie, w sensie jeszcze powinna być jedna strona.

1:21 - Mateusz Wojciechowski
  No, ona może być taka ogólna, bardzo. No. Bo tu już przechodzimy do meritum, nie? W sensie tu już są jakieś pytania filtrujące, nie?  Które... No tak, i dopiero potem te... Tak, tak. Ona może być, wiesz, jakaś tam prosta, to nic nie może być komplikowanego, ale...  No i to musi być lepiej rozłożone na stronie, ale co do samego wyglądu, co chwilę jeszcze.

1:49 - Wojciech Rudnicki (UAM Poznań)
  Dobra. Czyli to step 1 potem musi być jako step 2 na przykład, a ten step 1 trzeba bardziej dopracować.  I teraz ten step 2 mógłby być, nie wiem, jako step 1 na przykład potencjalnie, w sensie pytanie teraz, wybranie lokalizacji, że co, te rzeczy, to na przykład nie będą dostane w aplikacji jakby u nas, czy mają być, tylko no się zastanawiam, sensie, to jest niepotrzebne jakby to, powinno być tak, że wybierasz jakby kraj, powinna być opcja wyboru kraju, albo jeszcze jako osobna opcja jakby tutaj, tylko w tej aplikacji u nas jakby to demo, No właśnie, bo to nie musi działać, nie?
  ACTION ITEM: Update demo flow: remove 2 tiles; keep Step 3; add field outline; add 'not available' for unimplemented - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=146.9999

2:37 - Mikołaj
  Serio, pamiętajmy o tym, że, bo tutaj mamy tylko dwa miejsca i to jest trochę, trochę za mało tak wizualnie, mogą być jakieś dowolne miejsce, albo wyszukaj miejsce i nawet jak się wyszuka i będzie komunikat, że to jeszcze nie ten etap, czy funkcja jeszcze niedostępna, no to, to jest, to jest ok.  Będzie kilka po prostu reprezentatywnych miejsc, a reszta będzie... że no jeszcze to nie jest ten moment. I oni też tak mówili, że my nie mamy robić gdzieś gotowca, że wszystko pięknie, gra i buczy, tylko no jak to by miało działać, więc ta IO-a Poznań spoko, jeszcze bym dodał kilka miejsc takich porównawczych, taki benchmark pseudo i tyle, no i wizualizacja ładna.

3:23 - Oskar Pelzer
  W sensie, jeżeli ja mogę, to ja bym, no bo nie będziemy pokazywać samego narzędzia, tylko będziemy pokazywać animację. Tak, screena może tylko, sapki.  Nie no, w sensie animację jakby, no, on będzie, animacja będzie szła tak jak na tym, jak tam w Warszawie robiliśmy, powiedzmy, tak?  No. No i co tutaj jest? Ja bym usunął w ogóle te dwie opcje i zostawił tylko to find address and place i on po prostu wpisze ten adres do IO-y, tak?

3:56 - Mikołaj
  Tak.

3:57 - Oskar Pelzer
  Wyszuka, za... za... znaczy, jakbyś zaznaczył to IOA, demo, field, bo to też jest ważne. Tutaj on zaznacza tylko jakiś mały kawałeczek.  Proponuję, żeby to było zrobione tak, że znajdzie nam pole i obrysuje ładnie jego krawędzie.

4:19 - Wojciech Rudnicki (UAM Poznań)
  Bo tutaj no widać mniej więcej, tak?

4:22 - Oskar Pelzer
  Tylko nie wiem, czy mamy tyle czasu na to wszystko, nie? No ale to tylko na... W sensie nie rozumiem.  To może na Poznań nie zrobi. Ale nie rozumiem szczerze. Gdzie jest tutaj. robisz step by step? Mamy trzy minuty, Oskar, a ty...  Nie, no jakby nie, no po prostu w sensie wybierasz ten adres, tak? I pokazuję tobie, że już znalazło twoje to pole i ci obrysowało je, no.  I cię akceptujesz, no cokolwiek. Nie, że będzie...

4:58 - Wojciech Rudnicki (UAM Poznań)
  Jeśli pokażemy demo sami, jak... aplikacji to nie pokaże tej całej pracy włożonej. W sensie pierwsza rzecz to powinno być tak jak mówiliśmy pokazanie całego silika właśnie w formie jakiejś takiej animacji czy dojebanych.  Musił być ten efekt wow. To pierwsza część i druga część to może być samo demo aplikacji. Tylko teraz trzeba jakoś to mądrze posortować.  W międzyczasie wrzuciłem mu jeszcze te modele 3D które wam dzisiaj pokazywałem tą Dioramę i ten Polifork. że Polifork może być do prezentacji ta Diorama jakoś użyta do tych animacji.  Może coś ciekawego z tego wymyśli.

5:35 - Oskar Pelzer
  Już wam pokażę od razu.

5:39 - Wojciech Rudnicki (UAM Poznań)
  Chwila chwila. Mogę przenieść. Tu np. to.

5:51 - Oskar Pelzer
  Coś tak i nie. Step by step może być taka animacja właśnie co zebrali. i w ogóle, no.

6:08 - Wojciech Rudnicki (UAM Poznań)
  Dobra. Czyli, no dobra, czyli robimy tak, tak jak tutaj mówisz. Czyli będzie jakby po prostu, konkretna animacja to ma być przygotowana pod animację po prostu.

6:22 - Oskar Pelzer
  Ja będę jeszcze pisał ogólnie, bo pamiętam, że to było też ważne.

6:32 - Wojciech Rudnicki (UAM Poznań)
  Next. Czyli do tego stepu drugiego, tak, możemy usunąć te dwa, z podglądu po prostu, usunąć te dwa kafelki?

6:43 - Oskar Pelzer
  No, na przykład.

6:45 - Wojciech Rudnicki (UAM Poznań)
  Bo to jest potrzebne do po prostu prezentacji bardziej, nie? No kurde, też jest zająwiste, wam pokażę. Ta farma jest zajebista tutaj, jakby był taki ruszający się obraz tam, w tej prezentacji, to spoko, odbieramy na 3D, to będzie taki efekt wow, myślę, no i to wtedy zostaje, ten krok, że tutaj się potwierdza te zboża i to jest całe do wymiany, w sensie, znaczy, nie, to jest jeszcze okej, tu się to w ogóle rozjebało, to się rozjebało, że co, co?

7:48 - Mateusz Wojciechowski
  Mówię, że następnym tam jest do wyjebania, bo tam jest raport, chyba się generuje już w piątce, no, tutaj są okej, te switche, a w step 3 nic nie usuwamy, nic nie zmieniamy, nie, bo tam...  Były do wyboru to, co miałeś, to, co sadził rolnik, nie? W sensie to raczej musiało być, nie?

8:05 - Oskar Pelzer
  W sensie, no, to logiczne raczej.
  ACTION ITEM: Clean up UI text/UX: condense text; hide data sources; fix Step 7; remove 'weak evidence' - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=485.9999

8:10 - Mikołaj
  Tutaj były te filtry, chyba też dobrze działy.

8:12 - Mateusz Wojciechowski
  Oprócz tego, co się teraz wyjebało z tym tekstem, to dobrze działo.

8:16 - Wojciech Rudnicki (UAM Poznań)
  No, generalnie jakby ten tekst ten... No i tu, tu jest największy pole do naprawy, tak. No to osoba, która będzie to robić, żeby się ręcznie jakby jakoś wymyślić, jak to...  No w sensie generalnie powinno być wszystko na raz najebane. Powinno być jakby ukryte bardziej te rzeczy, żeby się na raz nie wyświetlało i żeby to nie było takie długie, I żeby te data sources też było na przykład po prostu ukryte, że można sobie rozwinąć to na przykład, nie?  I żeby to nie była taka ściana tekstu. To musi być bardziej skrótowo, to po pierwsze.

8:55 - Mateusz Wojciechowski
  Ta mapka, nie wiem, zostawialiśmy się przez chwilę, ona jest trochę już taka, robi się... Dramapka? No tutaj powiedzmy z PIS-kom.

9:03 - Oskar Pelzer
  w sensie ona już...

9:04 - Wojciech Rudnicki (UAM Poznań)
  To nie jest spoko, to powinno być, bo to jest proste wizualnie jakby. To jest proste jak chcę, w sensie do zrozumienia.

9:14 - Mikołaj
  Tak, ale no to nie jest takie do pokazania na presse na pewno.

9:20 - Oskar Pelzer
  W sensie ja nie wiem, czy to ma w ogóle jakieś przełożenie sensowne, tak szczerze, ale no nie wiem. jak nie.  W sensie no dobra, bo po prostu to akurat wie każdy, tak? No to jest taka wiedza powszechna. Ale co jest wiedza powszechna?  No to, że no nie wiem, nie sadzisz tam jak jest gorąco, tak? W sensie chyba, że chcesz w kraju, w którym nie wiesz na przykład jaki jest klimat, no.

9:49 - Wojciech Rudnicki (UAM Poznań)
  No ale tu masz idealnie jakby cały płot osmian rozpisany z konkretnymi zbożami. Plus jeszcze ryzyko.

9:58 - Oskar Pelzer
  rozumiem, rozumiem.

10:00 - Wojciech Rudnicki (UAM Poznań)
  To jest tak jak chcieliśmy wizualnie przedstawione, sensie osoba, która to będzie robić musi po prostu mieć jasną wizję i punkt po punkcie rozpisać co musi być zmienione.  I też w sumie bez sensu tutaj, moim zdaniem bez sensu pokazuje, że skoro on na początku wybiera jaki jest główny cel, to po co potem jest to zrobione tutaj.  I dlaczego, trzeba się dopytać dlaczego nam wyskakuje weak evidence, albo dlaczego danych brakuje gdzieś, że nie powinniśmy mieć w przykładach weak evidence.  Więc na pewno tu jest najebane tekstu za dużo. Tu jest okej, bo generalnie wszystkie dane są tutaj mniej więcej.  Ale to powinno być bardzo prosto rozpisane, tak jak mieliśmy bardzo prosto rozpisane te rekomendacje ostatnio na tym hackathonie. I to wszystko powinno być zwinięte na pewno.  A co do tego, to trzeba pomyśleć po prostu, jak to rozwiązać. Dalej, no to jeszcze nie wiemy, bo to jest niezrobione, rozumiem, te fiksy.  I tu jest jakiś raport, raport w sensie gotowy.

11:54 - Mikołaj
  To jest co? Aha, oprócz 1. Gdzie jest o bliźniakach?

12:00 - Wojciech Rudnicki (UAM Poznań)
  No, ale bliźniaki to jest backend, jakby to jest bliźniaki. To się liczy do tego po prostu, do prognoz.

12:09 - Oskar Pelzer
  Tak, no.

12:10 - Wojciech Rudnicki (UAM Poznań)
  Bo fajnie by to było jakoś wyeksponować.

12:12 - Mikołaj
  To myślę, na prezentacji to będzie w działaniu silnika.
  ACTION ITEM: Clarify w/ team: soil-quality input and twin/forecast handling - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=737.9999

12:19 - Oskar Pelzer
  Okej.

12:22 - Wojciech Rudnicki (UAM Poznań)
  Bo jakby on chciał to wrzucić jako punkt czwarty w aplikacji, to jest bez sensu, bo to jest element analizy, nie?

12:28 - Oskar Pelzer
  Ja w ogóle nie wiem, czy tutaj, bo mi się wydaje, że można by jeszcze jako na początku, bo nie wiem, czy to jest gdzieś ujęte, jakby wpisanie lub czy jest zaczytywane jakość gleby, bo nie jestem pewny, czy jest jakby, czy my znamy jakość gleby w danym miejscu na przykład, czy nie.  Jeżeli nie, to na przykład rolnik może samemu wpisać jakość gleby i na tej podstawie będą się prognozować plony z danego roku.  My prognoz nie robimy, to do zasady z tego co wiem.

13:04 - Wojciech Rudnicki (UAM Poznań)
  Okej, no dobra.

13:05 - Oskar Pelzer
  To trzeba dopytać, ale no...

13:08 - Wojciech Rudnicki (UAM Poznań)
  No i tutaj jest o tych piźniakach, że 10 przykładowych...

13:12 - Oskar Pelzer
  W sensie, bo te prognozy byłyby potrzebne do kosztów i przychodów, co nie? O co mi chodzi?

13:18 - Wojciech Rudnicki (UAM Poznań)
  Okej, no nie wiem, trzeba się spytać, ja nie wiem dokładnie teraz jak to działa, ale wydaje mi się, że my w prognozowaniu nie szliśmy jakoś szczególnie.

13:25 - Oskar Pelzer
  No i jak wejdziesz w słowniczek, to jest po angielsku, w sensie w polski słowniczek jak wejdziesz. Ej, a chyba, że już to zostało poprawione.  Nie, czekaj. Nie. Dobra, to jest jedno. Czyli w tym step 7 coś tam w ogóle jest do poprawy, bo nie wiem, bo nie zapisałem.

13:50 - Mateusz Wojciechowski
  Pokaż właśnie jeszcze raz ten raport 7, bo on jest nowy, on dopiero wyszedł z ostatnimi zmianami.

14:00 - Wojciech Rudnicki (UAM Poznań)
  No też jest do poprawy, bo to ch**o wygląda, ja nie wiem czy to jest w ogóle, no generalnie to jest dla jakimś adwizora raport, ale ja nie wiem czy ten step w ogóle jest potrzebny jako step, bo to jest tak de facto, tylko może być poprzednim i tylko może być przycisk, bo to sam zaproponował chyba i tyle.  Dobra, i to jest jedno, to nie wiem ja mogę, to dwie osoby mogą zacząć jakoś, nie wiem co, wy możecie teraz wziąć.
  ACTION ITEM: Finish polyrequests; coordinate w/ team on UI fixes - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=871.9999

14:42 - Oskar Pelzer
  Może tak, ja się zajmę dokończeniem tych polyrequestów, my się z chłopakami podzielimy tymi poprawkami, a ty byś prezentacją zaczął.  Dobra, ja wysyłam na czat tutaj co ja zapisałem. Wrócimy do stepu pierwszego, bo ja tam nie zapisałem, bo nie zdążyłem.  Ale to Fatomi będziesz miał. Ja wiem, ale jakby nie wskazywaliśmy, na którym jesteśmy w stepie zawsze i... Bo tutaj coś mieliśmy dodać.  Może przed step pierwszy ma być w ogóle.

15:17 - Wojciech Rudnicki (UAM Poznań)
  Przed ten step pierwszy to może być jakby step drugi, nie? No bo musi być jakieś... No właśnie, co to dodać?

15:25 - Mateusz Wojciechowski
  Nazwę może jakkolwiek aplikacji, nie wiem, opis krótki, w sensie jednozdaniowy, to może być jednozdanie, wiesz.

15:37 - Wojciech Rudnicki (UAM Poznań)
  Step drugi zamienił w ogóle kolejnością z pierwszym, nie? Że powinna być najpierw jakaś tam lokalizacja, a potem dopiero twój cel, Nie wiem, czy Oskar to...  odpowiada na twoje pytanie.

16:01 - Mateusz Wojciechowski
  No i w sumie jeszcze musimy poczekać na szóstkę zobaczyć, co z niej wyniknie, jak spuszujemy wszystko, Bo szóstkę z blankiem teraz.  No ale to idzie właśnie u mnie tam gdzieś.

16:21 - Oskar Pelzer
  No ale zobaczymy, jaki będzie output tego, Tych wszystkich zmian. Co tam wyrzuci? Na szczęście nie musimy za bardzo. Ja wiem, w sensie wiesz, ale tylko trzeba raczej sprawdzić, nie?  Zweryfikować, co tam wykluję.

16:45 - Wojciech Rudnicki (UAM Poznań)
  Ja w ogóle czynich rzeczy już robię na sonycie i tak dalej jakby oszczędzać usage, ale wy tam pewnie nie musicie się tam...  Ja mam reset o drugiej, potem zakładam, że do tego nie doczekamy. No, też tak
  ACTION ITEM: Push Fathom transcript to repo README - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=1021.9999

17:00 - Oskar Pelzer
  Okładam. A potem się zobaczy, o której musimy jutro tam się zrobić.

17:07 - Wojciech Rudnicki (UAM Poznań)
  czyli jakby generalnie to mamy rozpisane i wy się tym zaraz podzielicie, tak? Ja wrócę transkrypt, nie wiem, z Patoma na repo po prostu.

17:16 - Oskar Pelzer
  Mhm, ale to zostajemy na spotkaniu, czy jak?

17:19 - Wojciech Rudnicki (UAM Poznań)
  No, za chwilę przejdziemy na Discorda, ale chodzi mi o to, że trochę raz jeszcze narrację, wiem, prezentacji możemy omówić.  Jak to sobie wyobrażamy. Ja na podstawie tej narracji też będę budował. Czyli co?

17:34 - Oskar Pelzer
  Ja bym dla porównania sobie włączył prezentację, jakbyś włączył prezentację z tego, z tej Warszawy, to może coś tam to da.  Na repo będzie. W readme chyba. W readme będzie, no właśnie.

18:00 - Wojciech Rudnicki (UAM Poznań)
  Typo metr dane? Co to jest? Masz.

18:03 - Oskar Pelzer
  To ten. To do... Bóg. To do prezentacji ja masz.

18:20 - Wojciech Rudnicki (UAM Poznań)
  Inaczej zrobimy. Gdzie to było? Tu. Kopie łącze. A jakbyś wszedł, to nie otworzy ci się po prostu?

18:35 - Oskar Pelzer
  Nie, bo się wyświetla kod świetlowy.

18:37 - Wojciech Rudnicki (UAM Poznań)
  Otwórz mi to.

19:28 - Oskar Pelzer
  Nie wyświetlasz jak coś? Nie wiem.

19:40 - Wojciech Rudnicki (UAM Poznań)
  Dobra, czyli slide pierwszy.

19:43 - Oskar Pelzer
  Nazwa. A właśnie nazwę.

19:46 - Mikołaj
  Jakąś nazwę już na to wymyślamy, czy podejemy?

19:48 - Oskar Pelzer
  Podziałem na koniec, nie mam pomysłów.

19:59 - Wojciech Rudnicki (UAM Poznań)
  Solid.

20:00 - Oskar Pelzer
  Solid, solid, solid, solid, security i chuj.

20:25 - Mateusz Wojciechowski
  Smart Farmer i chuj. Nie, no możemy zostawić to na koniec.

20:40 - Oskar Pelzer
  Może jakieś regrow? Coś takiego? Nigrow?
  ACTION ITEM: Build deck v1: title, problem (Mariusz), engine flow, app demo, NASA data slide; then produce PL version - WATCH: https://fathom.video/share/hyvwv4vEAGfA3g9o4Cq-yrbhvisyFdb5?timestamp=1249.9999

20:47 - Mikołaj
  Regrow, regrow. No nie wiem, w sensie... No regrow, tylko się będzie kojarzyć z nigrow. Szanowni, do jednej ustawy.

21:00 - Wojciech Rudnicki (UAM Poznań)
  Zaby to na koniec, może widzę, że tutaj ta nazwa się nie widzi. Dobra, czyli mam slajd tytułowy, to, że nam pomogło.  No i potem co? Nie wiem, wprowadzanie do tematu jakieś, w sensie do obszaru problemowego, tylko...

21:17 - Oskar Pelzer
  Mało czasu.

21:19 - Mateusz Wojciechowski
  Ogólnie słyszałem, że dwie chyba grupy miały po siedem slajdów na dzisiaj, bo rozmawiali o samej koncepcji prezentacji.

21:27 - Oskar Pelzer
  Siedem slajdów. Ja bym w to nie szedł, ja bym szedł po prostu w szybkie klikanie slajdów.

21:33 - Wojciech Rudnicki (UAM Poznań)
  No, bo można i tak, sensie, ale wiesz, tylko mówię, co słyszałem, nie? Mało gadania, jakby dużo pokazywania na przykład, To było dwa, trzy zdania na slajd i od razu zmiana.  Tak jak w startupach, w piszdekach.

21:57 - Oskar Pelzer
  Rotwise. Rotwise. Jest coś takiego.

22:09 - Wojciech Rudnicki (UAM Poznań)
  Czyli robimy to wprowadzenie jakby na szybko, czyli że... Koncepcję trzeba by było powiedzieć, nie?

22:18 - Mateusz Wojciechowski
  Na czym to polega. Musi to być...

22:21 - Oskar Pelzer
  Sam problem, jakby. To musi być, nie? Bez tego to nie ma co zaczynać.

22:28 - Mateusz Wojciechowski
  Wyjaśnić pobudki.

22:30 - Oskar Pelzer
  Pobudki, a działanie pokażemy i wiesz, szybko powiesz, że działanie pokażemy na tych już, czy jakoś tam, w sensie...

22:36 - Mateusz Wojciechowski
  Może damy tego Boba, albo Mariusza.

22:39 - Oskar Pelzer
  To, że realnie jakby chcemy rozwiązać realny problem też, no jakby. No tak, że Mariusz ma problem z wyborem płodozmianu.

22:50 - Wojciech Rudnicki (UAM Poznań)
  Możemy, no. I wtedy wchodzimy my. Potem jest animacja tam tych dwudziestu iluś tam datasetów. z różnych źródeł. Potem oni się łączą w jedno rozwiązanie.

23:10 - Mikołaj
  Teraz jak pomyślałem, czy oni mają problem serio z wyborem tego? Kto? No farmerzy.

23:18 - Oskar Pelzer
  No w sensie wiesz, no nie wiesz, czy wybierasz najlepszą możliwą opcję, co nie? W nikt nie robi takich analiz.  O, bardziej. A bo mało kto.

23:29 - Mateusz Wojciechowski
  No no, o to mi chodzi. Czy oni tak wybierają w zasadzie, że sprawdziłem, może to będzie dobrze, czy doświadczenie poparte intuicjum.  O, to jest jak z Allegro, Zero analiz. To jest w każdym gospodarstwie. Gospodarstwo działa, a każde tak samo. Że decyzje nie są data-driven, a my im dajemy data-driven decyzjum.

23:50 - Mikołaj
  Intuition-driven. No ok, chciałem się właśnie tak...

23:53 - Wojciech Rudnicki (UAM Poznań)
  No czyli byłaby animacja tego Mariusza, który myśli sobie jak random... Generator, jakaś animacja.

24:01 - Oskar Pelzer
  Możemy zrobić taki zeszycik, w sensie takiego Mariusza siedzącego przy biurku i piszący na zeszycie, wiesz, tam ma tabelki jakieś z latami poprzednimi, co było zasiane i teraz co zasiać.  Dosłownie tata Marty prowadzi taki zeszycik.

24:21 - Wojciech Rudnicki (UAM Poznań)
  No i że taka chmurka, że losowe numerki i tak dalej i potem przekreślenie, że strzałka, że na te 24 data sety i to jakby wszystko w ramach, nie wiem, kolejnych slajdów, nie?  Jakby, że to się zmienia, ta animacja. Że te data sety potem one się łączą w nasze rozwiązanie i co się dzieje w bug endzie, jakieś jakby te animacje i na przykład porównanie z tymi polami no i potem już pokazanie samego działania aplikacji, nie?  Nie wiem, czy czeliście koncepcję, czy czesne to. omówiłem.

25:02 - Mikołaj
  Jeszcze raz.

25:04 - Wojciech Rudnicki (UAM Poznań)
  No a w którym momencie się zgubiłeś, czego nie zrozumiałeś? Nie wiem, o którego mogę to powtórzyć.

25:10 - Oskar Pelzer
  W sensie cały koncept, bo nie wiem, się zamiśliłem. jest slajd tytułowy.

25:18 - Wojciech Rudnicki (UAM Poznań)
  Jest slajd tytułowy. Tu przestawiamy Mariusza, który jest rolnikiem i ma dotychczas jakby te płody zmiany, czy tamte, jak zasiacz pola bierał losowo.  Dajemy go przekreślonego jakby w animacji. Czy tam jakby sposób jego działania przekreślony. Takiego zmęczonego może coś takiego też.

25:46 - Oskar Pelzer
  No jakby, no na przykład.

25:48 - Wojciech Rudnicki (UAM Poznań)
  I potem sposób tego, jak on to robił, to dajemy przekreślony. Potem strzałka i pojawiają się te data sety nasze.  I potem kolejny jakby moment no to... Te data sety łączą się w nasze rozwiązania, jakąś nazwę naszego rozwiązania. I potem w kolejnych slajdach animacja po prostu, jak ten backend działa, jakby ten silnik i właśnie pokazanie tych bliźniaków, tych pól, na przykład jako jeden z tych elementów, to czego Mikołajowi brakowało.  No i potem jakby na koniec animacja, aplikacja działa. I potem szczęśliwy Mariusz.

26:28 - Mateusz Wojciechowski
  Spoko, dam nie git.

26:30 - Oskar Pelzer
  O, Rumunia już strzeliła bramkę. Rumunia strzeliła nam bramkę już. A my gramy teraz? Ja pierdole, kurwa, z Rumunii.

26:46 - Mikołaj
  Już ostatnio z Bośnią.

26:50 - Oskar Pelzer
  Dobra, never mind. No mi się wydaje, że taki koncept jest spoko, no. Więc to będzie tak de facto jeden slajd wstępny.  potem Mariusz, potem silnik, aplikacji, to są trzy slajdy i tak de facto nie liczył, bo ja nie wiem ile to wyjdzie i tych animacji, po prostu musi być max 3.  No silnik wiesz, musimy na jednym pokazać. Dlaczego?

27:17 - Wojciech Rudnicki (UAM Poznań)
  to po prostu klikasz i animacja się zmienia.

27:20 - Oskar Pelzer
  Nie no, wiesz chodzi mi, tak tak, sensie, żeby wszystko potem gdzieś było widoczne na jednym slajdzie jakby, że od A do Z jest pokazane na jednym slajdzie, o to mi chodzi.  Nie wiem czy wiesz o mi chodzi. No tak, że... Albo to nie lepiej na jakiś diagram i potem po kolei te elementy jako animacja?

27:41 - Wojciech Rudnicki (UAM Poznań)
  Albo na koniec? Nie, diagramu bym nie robił, bo to za dużo oczu pląsu... No co chcesz na jednym slajdzie jakby anim...

27:51 - Oskar Pelzer
  po to będą zanimaty i pokazać te Tak, nie mówię, że tak, tak, ale żeby pokazać, że jest jeden przep...  no jakby zaczynasz od jednej... od tego problemu, tak? Powiedzmy. No. I kolejne rzeczy dorzucasz, nie wiem, po strzałkach czy coś.  A nie, że... prostu na ekranie te rzeczy się zmieniają. Okej, ale to będą się usuwać pozostałe, tak? Czy... No, no.  Dobra. W sensie ja myślałem, albo chociaż, na koniec było jakieś porównanie takiego... sensie, żeby był taki model, jak ty kiedyś mi wysyłałeś taki, właśnie taki schemat, jak działa jakiś silnik.  To był jakiś skill do Claude'a. Już nie pamiętam, jak to się nasypało. No, chyba... Nie, to nawet był chyba 2D, ale już nie pamiętam.  I taki schemat? To była w ogóle chyba taka animacja, żeby wyjaśnić komuś, jak działa rozwiązanie.

28:48 - Mikołaj
  Okej. No, ale to takie rysunkowe gówno? Nie, nie, nie.

28:52 - Oskar Pelzer
  W sensie, nie chodzi mi, że musi być rysunkowe. Tylko jakby samo założenie. No to... Tak, wysyłałem ci taki skill, ale to właśnie było takie...

29:00 - Wojciech Rudnicki (UAM Poznań)
  rysunkowe i to akurat nie pasuje mi tego konceptu.

29:02 - Oskar Pelzer
  Nie, że na tej zasadzie jakby.

29:05 - Wojciech Rudnicki (UAM Poznań)
  No tak, ale ja bym powiedział, że zrobię to i potem będziemy iterować, nie? No okej, okej.

29:10 - Oskar Pelzer
  W sensie, no. Nie chodziło o to, żeby, wiesz, żeby nie było tak, że nie wiem, pokazujesz jeden dataset i potem przechodzisz do następnego i nie widać, że one się jakoś łączą ze sobą.  No okej, no.

29:25 - Wojciech Rudnicki (UAM Poznań)
  Żeby pokazać proces, a nie pojedyncze składniki procesu. tu my w silniku nie będziemy już pokazywać samych danych, tylko bardziej proces, No tak, tak, no.

29:34 - Oskar Pelzer
  Żeby jakoś tu, nie wiem, na koniec nawet, wiesz, razem tą grafikę pokazać, jak to się łączy ze sobą. O to mi tylko chodzi po prostu.  No. No i na koniec jakby ta animacja, tak? Czyli takie szybkie przejście po prostu przez tą aplikację.

29:55 - Mikołaj
  A jeszcze takie jedno szybkie, takie krytyczne pytanie, czy... Nie odjeżdżamy trochę za bardzo od NASA? W sensie? Czy sam pomysł?  No, czy nie odjeżdżamy od polecenia? No nie, bo polecenie było, żeby poprawić jakość ziemi, tak?

30:19 - Wojciech Rudnicki (UAM Poznań)
  No i jakby tych równików, tak? Ja zaraz spytam.

30:27 - Mikołaj
  Tak, nie, nie, to wiecie, tylko tak po prostu wolę krytycznie zapytać, żeby no nie odjechać w tym, bo też to na pewno będą sprawdzać.  Spójność z tematem i tak dalej, i tak dalej. Z danymi, wiadomo, że większość danych mamy, ale tam prawo też inne dane, nie?  No zaraz oświetnie, co to wam powiem.

30:56 - Oskar Pelzer
  Ja bym na końcu ogólnie, po pokazaniu aplikacji... dosłownie tak wyświetlił, jak ostatnio zrobiliśmy taki myk, że wyświetliliśmy coś na końcu.  Nawet jak nie zdążymy, to po prostu wyświetlimy, jakie dane użyliśmy. Ostatni slajd. Ale to bez animacji pokazane.

31:16 - Wojciech Rudnicki (UAM Poznań)
  Okej, okej, no rzeczywiście.

31:17 - Oskar Pelzer
  Tylko żeby gdzieś tam zawrzeć to, że to są dane NASA na przykład, co nie? Ważne. Albo na koniec taki, może właśnie taki slajd końcowy, żeby pokazać.  My mieliśmy jeden taki slajd tutaj. z tym, jakich danych użyliśmy. No, spoko.

31:39 - Wojciech Rudnicki (UAM Poznań)
  Takie są te... Dobra. Wszystko jasne? sensie teraz...

32:13 - Oskar Pelzer
  Tak, ważne, żeby animacja, w sensie moim zdaniem ważne, żeby była po polsku, nie wiem, no... Nie no, prezentacja po angielsku.  Prezentacja jest po angielsku? Właśnie to jest coś, co zastanawialiśmy się z Mikołem po drodze jadąc.

32:29 - Mikołaj
  Tak, ale doszliśmy do wniosku, że never mind, bo zmiana, żeby te parę zdań, które będę na slajdach tam zrobił po angielsku, że po polsku to jest...  No pewnie, szczególnie, że to idzie do stanu Oskar, nie?

32:41 - Mateusz Wojciechowski
  No, więc chyba mi się wydarzy po angielsku, ale w sensie przedżyli, ty in face mówisz po polsku, ja tak...

32:47 - Oskar Pelzer
  No tak, ale...

32:50 - Wojciech Rudnicki (UAM Poznań)
  ja się dziwię, już rozmawialiśmy na ten temat, że się dziwię, że będzie sama prezentacja po angielsku, ale jakby my po polsku przedstawiamy, jakby dla mnie to jest nielogiczne, ale...  No widzisz, takie są, no bo to jest...

33:00 - Oskar Pelzer
  polskie żyli, Możemy sobie po prostu zrobić po angielsku, a jutro zrobić wersję po polsku, w sensie na wszelki wypadek, no bo mi się wydaje, że po prostu wygodniej się, jak mówisz po polsku, a pokazujesz po angielsku, to trochę tak nie intuicyjnie, ale no nie.

33:14 - Wojciech Rudnicki (UAM Poznań)
  No dlatego, jak będą treści wizualne, mało napisów, Oskar, to jak animacja...

33:20 - Oskar Pelzer
  Wiem, ale w samej animacji jakby masz jakieś tam treści i wiesz, na coś spojrzysz, no nie wiem, no jakby mi się by łatwiej robiło to po prostu w jednym języku.  No to musisz zastrzeżenia do korzenki Mikoja tutaj. Tak.

33:41 - Wojciech Rudnicki (UAM Poznań)
  Nie wiem, już wypuszczować na repo jakby to ten transkrypt Fatoma i ten będzie ci się dzielić? Chyba ta, no.  No dobra, i tam Oskar już możesz te pozostałe rzeczy chyba marchować? Chyba. Chyba. Zobaczę, co tu jest, co powiem.

34:04 - Oskar Pelzer
  Dobra, ja poprawiam ten słowniczek PL od razu. Te rzeczy już poprzednie powinny być wypuszowane, chyba?

34:14 - Wojciech Rudnicki (UAM Poznań)
  Tak, są wypchnięte tam te stare.

34:17 - Oskar Pelzer
  To są chyba twoje nowe jakieś, wiesz? No i te nowe już można też. To mi się wydaje, no. Ale tu jest komfort i kurde, przed moim komputerkiem.  Zajebisty internet. Procesorek. Procesorek zajebisty. Cieszymy się. Też go teraz przenieś tam.

34:46 - Wojciech Rudnicki (UAM Poznań)
  Dobra. To co, na Discorda idziemy? I rzucam transkrypty.

34:58 - Mateusz Wojciechowski
  Dobra, siema.
