# Dokument wymaga� produktu (PRD) - CulturAllyAI

## 1. Przegl�d produktu

### 1.1 Nazwa produktu
CulturAllyAI

### 1.2 Opis produktu
CulturAllyAI to prosta aplikacja webowa, kt�ra na podstawie danych podanych przez u�ytkownika generuje zwi�z�y opis wydarzenia kulturalnego.

### 1.3 G��wne funkcjonalno�ci
- Formularz tworzenia wydarzenia: miasto, data, kategoria (lista), kategoria wiekowa (lista), tytu�, �najwa�niejsze informacje� (do 200 znak�w)
- Generowanie opisu wydarzenia przez AI (do 500 znak�w), wy��cznie na podstawie danych wej�ciowych u�ytkownika
- Prosty system kont u�ytkownik�w
- Zapisywanie, edycja i usuwanie wybranych opis�w wydarze�
- Generowanie kr�tkich opis�w wydarze� przez AI
- System oceny trafno�ci rekomendacji

### 1.4 Grupa docelowa
Organizatorzy wydarze�, pracownicy instytucji kultury, wolontariusze i osoby przygotowuj�ce materia�y informacyjne o wydarzeniach.

### 1.5 Platforma
Aplikacja webowa (bez wersji mobilnej w MVP)

### 1.6 J�zyk aplikacji
Wy��cznie j�zyk polski

## 2. Problem u�ytkownika

### 2.1 G��wny problem
Szybkie stworzenie sp�jnego, zwi�z�ego i atrakcyjnego opisu wydarzenia na podstawie minimalnego zestawu informacji jest czasoch�onne i wymaga umiej�tno�ci redakcyjnych.

### 2.2 Problemy szczeg�owe
- Trudno�� w streszczaniu najwa�niejszych informacji do kr�tkiej formy
- Utrzymanie sp�jnego stylu i tonu komunikacji
- Potrzeba wielokrotnych poprawek i iteracji
- Presja czasu przy przygotowywaniu zapowiedzi wydarze�

### 2.3 Obecne rozwi�zania i ich ograniczenia
- R�czne pisanie opis�w (czasoch�onne, brak sp�jno�ci)
- Szablony statyczne (ma�a elastyczno��, sztampowe tre�ci)
- Narz�dzia AI bez ogranicze� mog� �dopowiada� fakty (ryzyko nie�cis�o�ci)

## 3. Wymagania funkcjonalne

### 3.1 Formularz tworzenia wydarzenia
- Pola obowi�zkowe: miasto (tekst), data (kalendarz), kategoria (lista), kategoria wiekowa (lista), tytu� (tekst), najwa�niejsze informacje (tekst, limit 200 znak�w)
- Kategorie: koncerty, imprezy, teatr i taniec, sztuka i wystawy, literatura, kino, festiwale, inne
- Kategorie wiekowe: wszystkie, najm�odsi, dzieci, nastolatkowie, m�odzi doro�li, doro�li, osoby starsze
- Liczniki znak�w dla �najwa�niejszych informacji� (200) i generowanego opisu (500)
- Walidacja: wymagane pola, poprawny format daty, limity znak�w, brak pustych warto�ci

### 3.2 Generowanie opisu przez AI
- Generowanie opisu do 500 znak�w w j�zyku polskim
- Opis musi by� sp�jny z wprowadzonymi danymi (miasto, data, kategoria, kategoria wiekowa, tytu�, najwa�niejsze informacje)
- Zakaz �dopowiadania� informacji niepodanych przez u�ytkownika (np. ceny, godziny, adresu, nazw wykonawc�w), chyba �e wynikaj� z og�lnej wiedzy o kategorii w spos�b niefaktograficzny (np. neutralne sformu�owania)
- Mechanizm oceny "kciuk w g�r�/d�" dla ka�dego wygenerowanego opisu
- Zapisywanie wygenerowanego opisu
- Kopiowanie wygenerowanego opisu do schowka za pomoc� jednego przycisku

### 3.3 Edycja i zarz�dzanie wydarzeniami
- R�czna edycja wygenerowanego opisu (limit 500 znak�w)
- Lista zapisanych wydarze�
- Usuwanie zapisanych wydarze�
- Kopiowanie wygenerowanego opisu do schowka za pomoc� jednego przycisku

### 3.4 System kont u�ytkownik�w
- Rejestracja oparta na emailu i ha�le (bez potwierdzania email)
- Logowanie do systemu
- Zarz�dzanie kontem (zmiana has�a, usuni�cie konta)
- Profil u�ytkownika z dost�pem do zapisanych wydarze�

### 3.5 Interfejs u�ytkownika
- Jednostronicowy uk�ad: formularz po lewej/g�rze, podgl�d opisu po prawej/poni�ej
- Przyciski: �Generuj opis�, �Zapisz�, �Kopiuj�, kciuk w g�r�, kciuk w d� w interfejsie generowania opisu
- Animacja �adowania podczas wyszukiwania
- Przyciski: �Edytuj opis�, �Usu� opis�, �Zmie� has�o�, �Usu� konto� w interfejsie zarz�dzania wydarzeniami w profilu
- Wyra�ne komunikaty walidacyjne i informacja, �e opis jest generowany automatycznie i wymaga akceptacji u�ytkownika

### 3.6 Ograniczenia i zgodno��
- Brak wyszukiwania w sieci
- Brak pobierania danych z Internetu (tylko dane u�ytkownika i wiedza modelu)
- Ochrona danych: tre�ci wprowadzone przez u�ytkownika s� wykorzystywane wy��cznie do generacji opisu

## 4. Granice produktu

### 4.1 Co JEST w zakresie MVP
- Formularz wprowadzania danych wydarzenia (miasto, data, kategoria, kategoria wiekowa, tytu�, najwa�niejsze informacje)
- System kont u�ytkownik�w z prost� rejestracj�
- Profil u�ytkownika z zarz�dzaniem kontem i zapisanymi opisami
- Generowanie, podgl�d i r�czna edycja opisu (do 500 znak�w)
- Zapisywanie wydarze�
- Kopiowanie opisu do schowka
- Aplikacja webowa w j�zyku polskim
- System ocen �kciuk w g�r�/d�

### 4.2 Co NIE JEST w zakresie MVP
- Wyszukiwanie wydarze� w Internecie, web scraping, rekomendacje
- Obs�uga wydarze� cyklicznych i kilkudniowych (pojedyncza data w MVP)
- Integracje z, kalendarzami, social media
- Wsp�dzielenie zapisanych opis�w mi�dzy kontami
- R�czne dodawanie opis�w przez u�ytkownik�w
- Funkcje spo�eczno�ciowe
- Aplikacja mobilna
- Onboarding u�ytkownika
- Funkcja ponownego wyszukiwania z tymi samymi parametrami
- Obs�uga wielu j�zyk�w

### 4.3 Przysz�e rozszerzenia (poza MVP)
- Aplikacja mobilna
- Funkcje spo�eczno�ciowe
- Wsp�dzielenie opis�w wydarze�
- R�czne dodawanie opis�w wydarze�
- Style/tona�lno�ci opis�w (np. formalny, promocyjny, m�odzie�owy)
- Szablony i s�owa kluczowe, warianty SEO
- Wydarzenia kilkudniowe i cykliczne
- Eksport (PDF/obraz) i udost�pnianie
- Integracje (kalendarze, social media)

## 5. Historyjki u�ytkownik�w

### US-001 - Rejestracja nowego konta
Tytu�: Rejestracja u�ytkownika w systemie
Opis: Jako nowy u�ytkownik chc� m�c zarejestrowa� si� w systemie, aby uzyska� dost�p do funkcjonalno�ci aplikacji.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, has�o, potwierdzenie has�a
- System waliduje unikalno�� adresu email
- System waliduje si�� has�a (minimum 8 znak�w)
- Po pomy�lnej rejestracji u�ytkownik zostaje automatycznie zalogowany
- Komunikat o b��dzie wy�wietla si� w przypadku niepowodzenia rejestracji

### US-002 - Logowanie do systemu
Tytu�: Logowanie istniej�cego u�ytkownika
Opis: Jako zarejestrowany u�ytkownik chc� m�c zalogowa� si� do systemu, aby uzyska� dost�p do swoich danych.
Kryteria akceptacji:
- Formularz logowania zawiera pola: email i has�o
- System weryfikuje poprawno�� danych logowania
- Po pomy�lnym zalogowaniu u�ytkownik zostaje przekierowany na stron� g��wn�
- Komunikat o b��dzie wy�wietla si� w przypadku niepoprawnych danych
- U�ytkownik pozostaje zalogowany do momentu wylogowania

### US-003 - Zarz�dzanie kontem u�ytkownika
Tytu�: Zarz�dzanie ustawieniami konta
Opis: Jako zalogowany u�ytkownik chc� m�c zarz�dza� swoim kontem, aby aktualizowa� dane lub usun�� konto.
Kryteria akceptacji:
- Mo�liwo�� zmiany has�a z walidacj� nowego has�a
- Mo�liwo�� usuni�cia konta z potwierdzeniem akcji
- Wszystkie dane u�ytkownika zostaj� usuni�te po usuni�ciu konta
- U�ytkownik zostaje wylogowany po usuni�ciu konta

### US-004 � Generowanie opisu wydarzenia
Tytu�: Generowanie opisu wydarzenia
Opis: Jako u�ytkownik chc� otrzyma� zwi�z�y opis wydarzenia.
Kryteria akceptacji:
- Formularz zawiera pola: miasto, dat�, kategori�, kategori� wiekow�, tytu� i najwa�niejsze informacje
- System weryfikuje poprawno�� i kompletno�� danych
- Po klikni�ciu �Generuj opis� powstaje opis do 500 znak�w w j�zyku polskim
- Opis nie zawiera niepodanych fakt�w

### US-005 � Kopiowanie opisu wydarzenia
Tytu�: Szybkie wykorzystanie tre�ci
Opis: Jako u�ytkownik chc� m�c skopiowa� opis do schowka jednym klikni�ciem.
Kryteria akceptacji:
- Przycisk �Kopiuj� kopiuje pe�ny opis i potwierdza operacj�

### US-006 - Zapisywanie wydarze�
Tytu�: Zapisywanie interesuj�cych wydarze�
Opis: Jako zalogowany u�ytkownik chc� m�c zapisa� interesuj�ce wydarzenia, aby m�c do nich wr�ci� p�niej.
Kryteria akceptacji:
- Klikni�cie przycisku "Zapisz" dodaje opis wydarzenia do listy zapisanych
- Przycisk "Zapisz" jest dost�pny tylko dla zalogowanych u�ytkownik�w
- Wizualne potwierdzenie zapisania wydarzenia
- Niemo�no�� wielokrotnego zapisania tego samego wydarzenia
- Przycisk zmienia si� na "Zapisane" po zapisaniu wydarzenia

### US-007 - Ocena rekomendacji
Tytu�: Ocena trafno�ci wygenerowanych opis�w wydarze�
Opis: Jako u�ytkownik chc� m�c oceni� trafno�� wygenerowanych opis�w, aby pom�c systemowi lepiej dopasowywa� przysz�e sugestie.
Kryteria akceptacji:
- Przyciski "kciuk w g�r�" i "kciuk w d�" przy ka�dym wygenerowanym opisie
- Niemo�no�� wielokrotnego ocenienia tego samego opisu
- Wizualne potwierdzenie z�o�enia oceny
- Oceny s� zapisywane i wp�ywaj� na przysz�e rekomendacje

### US-008 - Przegl�danie zapisanych opis�w
Tytu�: Przegl�danie zapisanych opis�w wydarze�
Opis: Jako zalogowany u�ytkownik chc� m�c przegl�da� swoje zapisane opisy wydarze�, aby �atwo znale�� interesuj�ce mnie informacje.
Kryteria akceptacji:
- Chronologiczna lista zapisanych opis�w wydarze�
- Mo�liwo�� usuni�cia opisu wydarzenia z listy zapisanych
- Pusta lista wy�wietla odpowiedni komunikat

### US-009 - Edycja opis�w wydarze�
Tytu�: Personalizacja opis�w wydarze�
Opis: Jako zalogowany u�ytkownik chc� m�c edytowa� opisy wydarze� wygenerowane przez AI, aby doda� w�asne notatki.
Kryteria akceptacji:
- Mo�liwo�� edycji opisu ka�dego zapisanego wydarzenia
- Limit 500 znak�w dla edytowanego opisu
- Wy�wietlanie liczby pozosta�ych znak�w podczas edycji
- Mo�liwo�� zapisania i anulowania zmian
- Przywracanie oryginalnego opisu wygenerowanego przez AI w przypadku anulowania

### US-010 - Wylogowanie z systemu
Tytu�: Bezpieczne wylogowanie u�ytkownika
Opis: Jako zalogowany u�ytkownik chc� m�c bezpiecznie wylogowa� si� z systemu, aby zako�czy� sesj�.
Kryteria akceptacji:
- Przycisk/link wylogowania dost�pny w interfejsie u�ytkownika
- Klikni�cie wylogowuje u�ytkownika i ko�czy sesj�
- Przekierowanie na stron� logowania po wylogowaniu
- Brak mo�liwo�ci dost�pu do funkcji wymagaj�cych logowania po wylogowaniu

## 6. Metryki sukcesu

### 6.1 Kluczowe wska�niki (KPI)

#### 6.1.1 Trafno�� rekomendacji
Cel: 75% wygenerowanych opis�w wydarze� jest trafnych i akceptowanych przez u�ytkownika
Pomiar: 
- Stosunek ocen pozytywnych ("kciuk w g�r�") do wszystkich ocen opis�w
- Stosunek zapisanych do wszystkich wygenerowanych opis�w

#### 6.1.2 Aktywno�� u�ytkownik�w - zapisywanie wydarze�
Cel: 75% u�ytkownik�w zapisuje ponad jeden opis tygodniowo
Pomiar:
- Liczba aktywnych u�ytkownik�w zapisuj�cych wi�cej ni� jeden opis na tydzie�
- �rednia liczba zapisanych opis�w na u�ytkownika na tydzie�

#### 6.1.3 Adopcja w pierwszym tygodniu
Cel: 90% u�ytkownik�w zapisuje co najmniej jeden opis w pierwszym tygodniu od za�o�enia konta
Pomiar:
- Odsetek nowych u�ytkownik�w, kt�rzy zapisali przynajmniej jeden opis w ci�gu 7 dni od rejestracji
- �redni czas do pierwszego zapisanego opisu
