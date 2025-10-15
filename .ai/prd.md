# Dokument wymagañ produktu (PRD) - CulturAllyAI

## 1. Przegl¹d produktu

### 1.1 Nazwa produktu
CulturAllyAI

### 1.2 Opis produktu
CulturAllyAI to prosta aplikacja webowa, która na podstawie danych podanych przez u¿ytkownika generuje zwiêz³y opis wydarzenia kulturalnego.

### 1.3 G³ówne funkcjonalnoœci
- Formularz tworzenia wydarzenia: miasto, data, kategoria (lista), kategoria wiekowa (lista), tytu³, „najwa¿niejsze informacje” (do 200 znaków)
- Generowanie opisu wydarzenia przez AI (do 500 znaków), wy³¹cznie na podstawie danych wejœciowych u¿ytkownika
- Prosty system kont u¿ytkowników
- Zapisywanie, edycja i usuwanie wybranych opisów wydarzeñ
- Generowanie krótkich opisów wydarzeñ przez AI
- System oceny trafnoœci rekomendacji

### 1.4 Grupa docelowa
Organizatorzy wydarzeñ, pracownicy instytucji kultury, wolontariusze i osoby przygotowuj¹ce materia³y informacyjne o wydarzeniach.

### 1.5 Platforma
Aplikacja webowa (bez wersji mobilnej w MVP)

### 1.6 Jêzyk aplikacji
Wy³¹cznie jêzyk polski

## 2. Problem u¿ytkownika

### 2.1 G³ówny problem
Szybkie stworzenie spójnego, zwiêz³ego i atrakcyjnego opisu wydarzenia na podstawie minimalnego zestawu informacji jest czasoch³onne i wymaga umiejêtnoœci redakcyjnych.

### 2.2 Problemy szczegó³owe
- Trudnoœæ w streszczaniu najwa¿niejszych informacji do krótkiej formy
- Utrzymanie spójnego stylu i tonu komunikacji
- Potrzeba wielokrotnych poprawek i iteracji
- Presja czasu przy przygotowywaniu zapowiedzi wydarzeñ

### 2.3 Obecne rozwi¹zania i ich ograniczenia
- Rêczne pisanie opisów (czasoch³onne, brak spójnoœci)
- Szablony statyczne (ma³a elastycznoœæ, sztampowe treœci)
- Narzêdzia AI bez ograniczeñ mog¹ „dopowiadaæ” fakty (ryzyko nieœcis³oœci)

## 3. Wymagania funkcjonalne

### 3.1 Formularz tworzenia wydarzenia
- Pola obowi¹zkowe: miasto (tekst), data (kalendarz), kategoria (lista), kategoria wiekowa (lista), tytu³ (tekst), najwa¿niejsze informacje (tekst, limit 200 znaków)
- Kategorie: koncerty, imprezy, teatr i taniec, sztuka i wystawy, literatura, kino, festiwale, inne
- Kategorie wiekowe: wszystkie, najm³odsi, dzieci, nastolatkowie, m³odzi doroœli, doroœli, osoby starsze
- Liczniki znaków dla „najwa¿niejszych informacji” (200) i generowanego opisu (500)
- Walidacja: wymagane pola, poprawny format daty, limity znaków, brak pustych wartoœci

### 3.2 Generowanie opisu przez AI
- Generowanie opisu do 500 znaków w jêzyku polskim
- Opis musi byæ spójny z wprowadzonymi danymi (miasto, data, kategoria, kategoria wiekowa, tytu³, najwa¿niejsze informacje)
- Zakaz „dopowiadania” informacji niepodanych przez u¿ytkownika (np. ceny, godziny, adresu, nazw wykonawców), chyba ¿e wynikaj¹ z ogólnej wiedzy o kategorii w sposób niefaktograficzny (np. neutralne sformu³owania)
- Mechanizm oceny "kciuk w górê/dó³" dla ka¿dego wygenerowanego opisu
- Zapisywanie wygenerowanego opisu
- Kopiowanie wygenerowanego opisu do schowka za pomoc¹ jednego przycisku

### 3.3 Edycja i zarz¹dzanie wydarzeniami
- Rêczna edycja wygenerowanego opisu (limit 500 znaków)
- Lista zapisanych wydarzeñ
- Usuwanie zapisanych wydarzeñ
- Kopiowanie wygenerowanego opisu do schowka za pomoc¹ jednego przycisku

### 3.4 System kont u¿ytkowników
- Rejestracja oparta na emailu i haœle (bez potwierdzania email)
- Logowanie do systemu
- Zarz¹dzanie kontem (zmiana has³a, usuniêcie konta)
- Profil u¿ytkownika z dostêpem do zapisanych wydarzeñ

### 3.5 Interfejs u¿ytkownika
- Jednostronicowy uk³ad: formularz po lewej/górze, podgl¹d opisu po prawej/poni¿ej
- Przyciski: „Generuj opis”, „Zapisz”, „Kopiuj”, kciuk w górê, kciuk w dó³ w interfejsie generowania opisu
- Animacja ³adowania podczas wyszukiwania
- Przyciski: „Edytuj opis”, „Usuñ opis”, „Zmieñ has³o”, „Usuñ konto” w interfejsie zarz¹dzania wydarzeniami w profilu
- WyraŸne komunikaty walidacyjne i informacja, ¿e opis jest generowany automatycznie i wymaga akceptacji u¿ytkownika

### 3.6 Ograniczenia i zgodnoœæ
- Brak wyszukiwania w sieci
- Brak pobierania danych z Internetu (tylko dane u¿ytkownika i wiedza modelu)
- Ochrona danych: treœci wprowadzone przez u¿ytkownika s¹ wykorzystywane wy³¹cznie do generacji opisu

## 4. Granice produktu

### 4.1 Co JEST w zakresie MVP
- Formularz wprowadzania danych wydarzenia (miasto, data, kategoria, kategoria wiekowa, tytu³, najwa¿niejsze informacje)
- System kont u¿ytkowników z prost¹ rejestracj¹
- Profil u¿ytkownika z zarz¹dzaniem kontem i zapisanymi opisami
- Generowanie, podgl¹d i rêczna edycja opisu (do 500 znaków)
- Zapisywanie wydarzeñ
- Kopiowanie opisu do schowka
- Aplikacja webowa w jêzyku polskim
- System ocen „kciuk w górê/dó³”

### 4.2 Co NIE JEST w zakresie MVP
- Wyszukiwanie wydarzeñ w Internecie, web scraping, rekomendacje
- Obs³uga wydarzeñ cyklicznych i kilkudniowych (pojedyncza data w MVP)
- Integracje z, kalendarzami, social media
- Wspó³dzielenie zapisanych opisów miêdzy kontami
- Rêczne dodawanie opisów przez u¿ytkowników
- Funkcje spo³ecznoœciowe
- Aplikacja mobilna
- Onboarding u¿ytkownika
- Funkcja ponownego wyszukiwania z tymi samymi parametrami
- Obs³uga wielu jêzyków

### 4.3 Przysz³e rozszerzenia (poza MVP)
- Aplikacja mobilna
- Funkcje spo³ecznoœciowe
- Wspó³dzielenie opisów wydarzeñ
- Rêczne dodawanie opisów wydarzeñ
- Style/tona­lnoœci opisów (np. formalny, promocyjny, m³odzie¿owy)
- Szablony i s³owa kluczowe, warianty SEO
- Wydarzenia kilkudniowe i cykliczne
- Eksport (PDF/obraz) i udostêpnianie
- Integracje (kalendarze, social media)

## 5. Historyjki u¿ytkowników

### US-001 - Rejestracja nowego konta
Tytu³: Rejestracja u¿ytkownika w systemie
Opis: Jako nowy u¿ytkownik chcê móc zarejestrowaæ siê w systemie, aby uzyskaæ dostêp do funkcjonalnoœci aplikacji.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, has³o, potwierdzenie has³a
- System waliduje unikalnoœæ adresu email
- System waliduje si³ê has³a (minimum 8 znaków)
- Po pomyœlnej rejestracji u¿ytkownik zostaje automatycznie zalogowany
- Komunikat o b³êdzie wyœwietla siê w przypadku niepowodzenia rejestracji

### US-002 - Logowanie do systemu
Tytu³: Logowanie istniej¹cego u¿ytkownika
Opis: Jako zarejestrowany u¿ytkownik chcê móc zalogowaæ siê do systemu, aby uzyskaæ dostêp do swoich danych.
Kryteria akceptacji:
- Formularz logowania zawiera pola: email i has³o
- System weryfikuje poprawnoœæ danych logowania
- Po pomyœlnym zalogowaniu u¿ytkownik zostaje przekierowany na stronê g³ówn¹
- Komunikat o b³êdzie wyœwietla siê w przypadku niepoprawnych danych
- U¿ytkownik pozostaje zalogowany do momentu wylogowania

### US-003 - Zarz¹dzanie kontem u¿ytkownika
Tytu³: Zarz¹dzanie ustawieniami konta
Opis: Jako zalogowany u¿ytkownik chcê móc zarz¹dzaæ swoim kontem, aby aktualizowaæ dane lub usun¹æ konto.
Kryteria akceptacji:
- Mo¿liwoœæ zmiany has³a z walidacj¹ nowego has³a
- Mo¿liwoœæ usuniêcia konta z potwierdzeniem akcji
- Wszystkie dane u¿ytkownika zostaj¹ usuniête po usuniêciu konta
- U¿ytkownik zostaje wylogowany po usuniêciu konta

### US-004 – Generowanie opisu wydarzenia
Tytu³: Generowanie opisu wydarzenia
Opis: Jako u¿ytkownik chcê otrzymaæ zwiêz³y opis wydarzenia.
Kryteria akceptacji:
- Formularz zawiera pola: miasto, datê, kategoriê, kategoriê wiekow¹, tytu³ i najwa¿niejsze informacje
- System weryfikuje poprawnoœæ i kompletnoœæ danych
- Po klikniêciu „Generuj opis” powstaje opis do 500 znaków w jêzyku polskim
- Opis nie zawiera niepodanych faktów

### US-005 – Kopiowanie opisu wydarzenia
Tytu³: Szybkie wykorzystanie treœci
Opis: Jako u¿ytkownik chcê móc skopiowaæ opis do schowka jednym klikniêciem.
Kryteria akceptacji:
- Przycisk „Kopiuj” kopiuje pe³ny opis i potwierdza operacjê

### US-006 - Zapisywanie wydarzeñ
Tytu³: Zapisywanie interesuj¹cych wydarzeñ
Opis: Jako zalogowany u¿ytkownik chcê móc zapisaæ interesuj¹ce wydarzenia, aby móc do nich wróciæ póŸniej.
Kryteria akceptacji:
- Klikniêcie przycisku "Zapisz" dodaje opis wydarzenia do listy zapisanych
- Przycisk "Zapisz" jest dostêpny tylko dla zalogowanych u¿ytkowników
- Wizualne potwierdzenie zapisania wydarzenia
- Niemo¿noœæ wielokrotnego zapisania tego samego wydarzenia
- Przycisk zmienia siê na "Zapisane" po zapisaniu wydarzenia

### US-007 - Ocena rekomendacji
Tytu³: Ocena trafnoœci wygenerowanych opisów wydarzeñ
Opis: Jako u¿ytkownik chcê móc oceniæ trafnoœæ wygenerowanych opisów, aby pomóc systemowi lepiej dopasowywaæ przysz³e sugestie.
Kryteria akceptacji:
- Przyciski "kciuk w górê" i "kciuk w dó³" przy ka¿dym wygenerowanym opisie
- Niemo¿noœæ wielokrotnego ocenienia tego samego opisu
- Wizualne potwierdzenie z³o¿enia oceny
- Oceny s¹ zapisywane i wp³ywaj¹ na przysz³e rekomendacje

### US-008 - Przegl¹danie zapisanych opisów
Tytu³: Przegl¹danie zapisanych opisów wydarzeñ
Opis: Jako zalogowany u¿ytkownik chcê móc przegl¹daæ swoje zapisane opisy wydarzeñ, aby ³atwo znaleŸæ interesuj¹ce mnie informacje.
Kryteria akceptacji:
- Chronologiczna lista zapisanych opisów wydarzeñ
- Mo¿liwoœæ usuniêcia opisu wydarzenia z listy zapisanych
- Pusta lista wyœwietla odpowiedni komunikat

### US-009 - Edycja opisów wydarzeñ
Tytu³: Personalizacja opisów wydarzeñ
Opis: Jako zalogowany u¿ytkownik chcê móc edytowaæ opisy wydarzeñ wygenerowane przez AI, aby dodaæ w³asne notatki.
Kryteria akceptacji:
- Mo¿liwoœæ edycji opisu ka¿dego zapisanego wydarzenia
- Limit 500 znaków dla edytowanego opisu
- Wyœwietlanie liczby pozosta³ych znaków podczas edycji
- Mo¿liwoœæ zapisania i anulowania zmian
- Przywracanie oryginalnego opisu wygenerowanego przez AI w przypadku anulowania

### US-010 - Wylogowanie z systemu
Tytu³: Bezpieczne wylogowanie u¿ytkownika
Opis: Jako zalogowany u¿ytkownik chcê móc bezpiecznie wylogowaæ siê z systemu, aby zakoñczyæ sesjê.
Kryteria akceptacji:
- Przycisk/link wylogowania dostêpny w interfejsie u¿ytkownika
- Klikniêcie wylogowuje u¿ytkownika i koñczy sesjê
- Przekierowanie na stronê logowania po wylogowaniu
- Brak mo¿liwoœci dostêpu do funkcji wymagaj¹cych logowania po wylogowaniu

## 6. Metryki sukcesu

### 6.1 Kluczowe wskaŸniki (KPI)

#### 6.1.1 Trafnoœæ rekomendacji
Cel: 75% wygenerowanych opisów wydarzeñ jest trafnych i akceptowanych przez u¿ytkownika
Pomiar: 
- Stosunek ocen pozytywnych ("kciuk w górê") do wszystkich ocen opisów
- Stosunek zapisanych do wszystkich wygenerowanych opisów

#### 6.1.2 Aktywnoœæ u¿ytkowników - zapisywanie wydarzeñ
Cel: 75% u¿ytkowników zapisuje ponad jeden opis tygodniowo
Pomiar:
- Liczba aktywnych u¿ytkowników zapisuj¹cych wiêcej ni¿ jeden opis na tydzieñ
- Œrednia liczba zapisanych opisów na u¿ytkownika na tydzieñ

#### 6.1.3 Adopcja w pierwszym tygodniu
Cel: 90% u¿ytkowników zapisuje co najmniej jeden opis w pierwszym tygodniu od za³o¿enia konta
Pomiar:
- Odsetek nowych u¿ytkowników, którzy zapisali przynajmniej jeden opis w ci¹gu 7 dni od rejestracji
- Œredni czas do pierwszego zapisanego opisu
