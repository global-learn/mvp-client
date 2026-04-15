// ================================================================
// App.tsx — точка входа приложения (слой app в FSD)
// ================================================================
// В FSD этот файл обычно живёт в src/app/App.tsx,
// но мы оставляем его здесь т.к. src/main.tsx ожидает его здесь.
//
// App.tsx только: подключает провайдеры + рендерит роутер.
// Никакой бизнес-логики здесь нет и быть не должно.


import {Providers} from "@app/providers";
import {AppRouter} from "@app/router";

function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

export default App;
