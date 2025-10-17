# Dokument wymagań produktu (PRD) - CulturAllyAI

## 1. Przegląd produktu

### 1.1 Nazwa produktu
CulturAllyAI

### 1.2 Opis produktu
CulturAllyAI to prosta aplikacja webowa, która na podstawie danych podanych przez użytkownika generuje zwięzły opis wydarzenia kulturalnego.

### 1.3 Główne funkcjonalności
- Formularz tworzenia wydarzenia: miasto, data, kategoria (lista), kategoria wiekowa (lista), tytuł, najważniejsze informacje (do 200 znaków)
- Generowanie opisu wydarzenia przez AI (do 500 znaków), wyłącznie na podstawie danych wejściowych użytkownika
- Prosty system kont użytkowników
- Zapisywanie, edycja i usuwanie wybranych opisów wydarzeń
- Generowanie krótkich opisów wydarzeń przez AI
- System oceny trafności rekomendacji

### 1.4 Grupa docelowa
Organizatorzy wydarzeń, pracownicy instytucji kultury, wolontariusze i osoby przygotowujące materiały informacyjne o wydarzeniach.

### 1.5 Platforma
Aplikacja webowa (bez wersji mobilnej w MVP)

### 1.6 Język aplikacji
Wyłącznie język polski

## 2. Problemy użytkownika

### 2.1 Główny problem
Szybkie stworzenie spójnego, zwięzłego i atrakcyjnego opisu wydarzenia na podstawie minimalnego zestawu informacji jest czasochłonne i wymaga umiejętności redakcyjnych.

### 2.2 Problemy szczegółowe
- Trudność w streszczaniu najważniejszych informacji do krótkiej formy
- Utrzymanie spójnego stylu i tonu komunikacji
- Potrzeba wielokrotnych poprawek i iteracji
- Presja czasu przy przygotowywaniu zapowiedzi wydarzeń

### 2.3 Obecne rozwiązania i ich ograniczenia
- Ręczne pisanie opisów (czasochłonne, brak spójności)
- Szablony statyczne (mała elastyczność, sztampowe treści)
- Narzędzia AI bez ograniczeń mogą dopowiadać fakty (ryzyko nieścisłości)

## 3. Wymagania funkcjonalne

### 3.1 Formularz tworzenia wydarzenia
- Pola obowiązkowe: miasto (tekst), data (kalendarz), kategoria (lista), kategoria wiekowa (lista), tytuł (tekst), najważniejsze informacje (tekst, limit 200 znaków)
- Kategorie: koncerty, imprezy, teatr i taniec, sztuka i wystawy, literatura, kino, festiwale, inne
-- Kategorie wiekowe: wszystkie, najmłodsi, dzieci, nastolatkowie, młodzi dorośli, dorośli, osoby starsze
-- Liczniki znaków dla "najważniejszych informacji" (200) i generowanego opisu (500)
-- Walidacja: wymagane pola, poprawny format daty, limity znaków, brak pustych wartości

### 3.2 Generowanie opisu przez AI
- Generowanie opisu do 500 znaków w języku polskim
- Opis musi być spójny z wprowadzonymi danymi (miasto, data, kategoria, kategoria wiekowa, tytuł, najważniejsze informacje)
- Zakaz "dopowiadania" informacji niepodanych przez użytkownika (np. ceny, godziny, adresu, nazw wykonawców), chyba że wynikają z ogólnej wiedzy o kategorii w sposób niefaktograficzny (np. neutralne sformułowania)
-- Mechanizm oceny "kciuk w górę/dół" dla każdego wygenerowanego opisu
-- Zapisywanie wygenerowanego opisu
-- Kopiowanie wygenerowanego opisu do schowka za pomocą jednego przycisku

### 3.3 Edycja i zarządzanie wydarzeniami
- Ręczna edycja wygenerowanego opisu (limit 500 znaków)
- Lista zapisanych wydarzeń
- Usuwanie zapisanych wydarzeń
- Kopiowanie wygenerowanego opisu do schowka za pomocą jednego przycisku

### 3.4 System kont użytkowników
- Rejestracja oparta na emailu i haśle (bez potwierdzania email)
- Logowanie do systemu
- Zarządzanie kontem (zmiana hasła, usunięcie konta)
- Profil użytkownika z dostępem do zapisanych wydarzeń

### 3.5 Interfejs użytkownika
- Jednostronicowy układ: formularz po lewej/górze, podgląd opisu po prawej/poniżej
- Przyciski: "Generuj opis", "Zapisz", "Kopiuj", kciuk w górę, kciuk w dół w interfejsie generowania opisu
- Animacja ładowania podczas wyszukiwania
- Przyciski: "Edytuj opis", "Usuń opis", "Zmień hasło", "Usuń konto" w interfejsie zarządzania wydarzeniami w profilu
- Wyraźne komunikaty walidacyjne i informacja, że opis jest generowany automatycznie i wymaga akceptacji użytkownika

### 3.6 Ograniczenia i zgodność
- Brak wyszukiwania w sieci
- Brak pobierania danych z Internetu (tylko dane użytkownika i wiedza modelu)
- Ochrona danych: treści wprowadzone przez użytkownika są wykorzystywane wyłącznie do generacji opisu

## 4. Granice produktu

### 4.1 Co JEST w zakresie MVP
- Formularz wprowadzania danych wydarzenia (miasto, data, kategoria, kategoria wiekowa, tytuł, najważniejsze informacje)
- System kont użytkowników z prostą rejestracją
- Profil użytkownika z zarządzaniem kontem i zapisanymi opisami
- Generowanie, podgląd i ręczna edycja opisu (do 500 znaków)
- Zapisywanie wydarzeń
- Kopiowanie opisu do schowka
- Aplikacja webowa w języku polskim
- System ocen kciuk w górę/dół

### 4.2 Co NIE JEST w zakresie MVP
- Wyszukiwanie wydarzeń w Internecie, web scraping, rekomendacje
- Obsługa wydarzeń cyklicznych i kilkudniowych (pojedyncza data w MVP)
- Integracje z kalendarzami, social media
- Współdzielenie zapisanych opisów między kontami
- Ręczne dodawanie opisów przez użytkowników
- Funkcje społecznościowe
- Aplikacja mobilna
- Onboarding użytkownika
- Funkcja ponownego wyszukiwania z tymi samymi parametrami
- Obsługa wielu języków

### 4.3 Przyszłe rozszerzenia (poza MVP)
- Aplikacja mobilna
- Funkcje społecznościowe
- Współdzielenie opisów wydarzeń
- Ręczne dodawanie opisów wydarzeń
- Style/tonalności opisów (np. formalny, promocyjny, młodzieżowy)
- Szablony i słowa kluczowe, warianty SEO
- Wydarzenia kilkudniowe i cykliczne
- Eksport (PDF/obraz) i udostępnianie
- Integracje (kalendarze, social media)

## 5. Historyjki użytkowników

### US-001 - Rejestracja nowego konta
Tytuł: Rejestracja użytkownika w systemie
Opis: Jako nowy użytkownik chcę móc zarejestrować się w systemie, aby uzyskać dostęp do funkcjonalności aplikacji.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła
- System waliduje unikalność adresu email
- System waliduje siłę hasła (minimum 8 znaków)
- Po pomyślnej rejestracji użytkownik zostaje automatycznie zalogowany
- Komunikat o błędzie wyświetla się w przypadku niepowodzenia rejestracji

### US-002 - Logowanie do systemu
Tytuł: Logowanie istniejącego użytkownika
Opis: Jako zarejestrowany użytkownik chcę móc zalogować się do systemu, aby uzyskać dostęp do swoich danych.
Kryteria akceptacji:
- Formularz logowania zawiera pola: email i hasło
- System weryfikuje poprawność danych logowania
- Po pomyślnym zalogowaniu użytkownik zostaje przekierowany na stronę główną
- Komunikat o błędzie wyświetla się w przypadku niepoprawnych danych
- Użytkownik pozostaje zalogowany do momentu wylogowania

### US-003 - Zarządzanie kontem użytkownika
Tytuł: Zarządzanie ustawieniami konta
Opis: Jako zalogowany użytkownik chcę móc zarządzać swoim kontem, aby aktualizować dane lub usunąć konto.
Kryteria akceptacji:
- Możliwość zmiany hasła z walidacją nowego hasła
- Możliwość usunięcia konta z potwierdzeniem akcji
- Wszystkie dane użytkownika zostają usunięte po usunięciu konta
- Użytkownik zostaje wylogowany po usunięciu konta

### US-004 - Generowanie opisu wydarzenia
Tytuł: Generowanie opisu wydarzenia
Opis: Jako użytkownik chcę otrzymać zwięzły opis wydarzenia.
Kryteria akceptacji:
- Formularz zawiera pola: miasto, datę, kategorię, kategorię wiekową, tytuł i najważniejsze informacje
- System weryfikuje poprawność i kompletność danych
- Po kliknięciu "Generuj opis" powstaje opis do 500 znaków w języku polskim
- Opis nie zawiera niepodanych faktów

### US-005 - Kopiowanie opisu wydarzenia
Tytuł: Szybkie wykorzystanie treści
Opis: Jako użytkownik chcę móc skopiować opis do schowka jednym kliknięciem.
Kryteria akceptacji:
- Przycisk "Kopiuj" kopiuje pełny opis i potwierdza operację

### US-006 - Zapisywanie wydarzeń
Tytuł: Zapisywanie interesujących wydarzeń
Opis: Jako zalogowany użytkownik chcę móc zapisać interesujące wydarzenia, aby móc do nich wrócić później.
Kryteria akceptacji:
- Kliknięcie przycisku "Zapisz" dodaje opis wydarzenia do listy zapisanych
- Przycisk "Zapisz" jest dostępny tylko dla zalogowanych użytkowników
- Wizualne potwierdzenie zapisania wydarzenia
- Niemożność wielokrotnego zapisania tego samego wydarzenia
- Przycisk zmienia się na "Zapisane" po zapisaniu wydarzenia

### US-007 - Ocena rekomendacji
Tytuł: Ocena trafności wygenerowanych opisów wydarzeń
Opis: Jako użytkownik chcę móc ocenić trafność wygenerowanych opisów, aby pomóc systemowi lepiej dopasowywać przyszłe sugestie.
Kryteria akceptacji:
- Przyciski "kciuk w górę" i "kciuk w dół" przy każdym wygenerowanym opisie
- Niemożność wielokrotnego ocenienia tego samego opisu
- Wizualne potwierdzenie złożenia oceny
- Oceny są zapisywane i wpływają na przyszłe rekomendacje

### US-008 - Przeglądanie zapisanych opisów
Tytuł: Przeglądanie zapisanych opisów wydarzeń
Opis: Jako zalogowany użytkownik chcę móc przeglądać swoje zapisane opisy wydarzeń, aby łatwo znaleźć interesujące mnie informacje.
Kryteria akceptacji:
- Chronologiczna lista zapisanych opisów wydarzeń
- Możliwość usunięcia opisu wydarzenia z listy zapisanych
- Pusta lista wyświetla odpowiedni komunikat

### US-009 - Edycja opisów wydarzeń
Tytuł: Personalizacja opisów wydarzeń
Opis: Jako zalogowany użytkownik chcę móc edytować opisy wydarzeń wygenerowane przez AI, aby dodać własne notatki.
Kryteria akceptacji:
- Możliwość edycji opisu każdego zapisanego wydarzenia
- Limit 500 znaków dla edytowanego opisu
- Wyświetlanie liczby pozostałych znaków podczas edycji
- Możliwość zapisania i anulowania zmian
- Przywracanie oryginalnego opisu wygenerowanego przez AI w przypadku anulowania

### US-010 - Wylogowanie z systemu
Tytuł: Bezpieczne wylogowanie użytkownika
Opis: Jako zalogowany użytkownik chcę móc bezpiecznie wylogować się z systemu, aby zakończyć sesję.
Kryteria akceptacji:
- Przycisk/link wylogowania dostępny w interfejsie użytkownika
- Kliknięcie wylogowuje użytkownika i kończy sesję
- Przekierowanie na stronę logowania po wylogowaniu
- Brak możliwości dostępu do funkcji wymagających logowania po wylogowaniu

## 6. Metryki sukcesu

### 6.1 Kluczowe wskaźniki (KPI)

#### 6.1.1 Trafność rekomendacji
Cel: 75% wygenerowanych opisów wydarzeń jest trafnych i akceptowanych przez użytkownika
Pomiar: 
- Stosunek ocen pozytywnych ("kciuk w górę") do wszystkich ocen opisów
- Stosunek zapisanych do wszystkich wygenerowanych opisów

#### 6.1.2 Aktywność użytkowników - zapisywanie wydarzeń
Cel: 75% użytkowników zapisuje ponad jeden opis tygodniowo
Pomiar:
- Liczba aktywnych użytkowników zapisujących więcej niż jeden opis na tydzień
- Średnia liczba zapisanych opisów na użytkownika na tydzień

#### 6.1.3 Adopcja w pierwszym tygodniu
Cel: 90% użytkowników zapisuje co najmniej jeden opis w pierwszym tygodniu od założenia konta
Pomiar:
- Odsetek nowych użytkowników, którzy zapisali przynajmniej jeden opis w ciągu 7 dni od rejestracji
- Średni czas do pierwszego zapisanego opisu
