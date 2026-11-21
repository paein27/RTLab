# Radio Transients Lab (RTL) – Sitio web

Sitio web del **Radio Transients Lab (RTL)**, Astroengineering Center UC (AIUC), Pontificia Universidad Católica de Chile. Está hecho con [Astro](https://astro.build/) (sitio estático) y [Tailwind CSS](https://tailwindcss.com/).

## Estructura

```text
/
├── public/
│   ├── images/logo/        # Logo RTL (color, blanco, monograma) y favicons
│   └── images/miembros/    # Retratos 600×600 (<slug>.jpg)
├── src/
│   ├── data/
│   │   ├── site.json       # Nombre, logo, institución, correo, ID de la biblioteca ADS
│   │   └── team.json       # Integrantes del grupo
│   ├── lib/
│   │   ├── team.ts         # Tipos, grupos y coincidencia de autores ADS ↔ miembros
│   │   └── ads.ts          # Consulta a NASA ADS (en el build)
│   ├── components/         # Navbar, Footer, MemberCard
│   ├── layouts/            # DefaultLayout (head, navbar, footer)
│   ├── pages/              # index, research, members, publications, outreach, resources, contact
│   │   └── api/publications.json.ts  # Exporta las publicaciones como JSON
│   └── styles/global.css   # Estilos base y componentes (.card, .btn-primary, .starfield…)
├── tailwind.config.cjs     # Paleta `brand-*` y fuentes (Montserrat / Inter)
└── astro.config.mjs
```

## Comandos

| Comando           | Acción                                          |
| :---------------- | :---------------------------------------------- |
| `npm install`     | Instala dependencias                            |
| `npm run dev`     | Servidor de desarrollo en `http://localhost:4321` |
| `npm run build`   | Compila el sitio en `./dist/` (consulta ADS)    |
| `npm run preview` | Sirve localmente la compilación de `./dist/`    |

## Editar contenido

- **Nombre, logo, correo, institución:** `src/data/site.json`.
- **Integrantes:** `src/data/team.json`. Cada entrada tiene:
  - `group`: `lead`, `staff`, `students`, `interns` o `team` (define la sección en *Members*).
  - `img`: ruta a `public/images/miembros/<slug>.jpg` (cuadrada, ~600 px). Si se deja vacío se muestran las iniciales.
  - `adsNames`: cómo aparece la persona como autora en ADS (`"Apellido, N."`). Sirve para resaltar sus nombres en *Publications*.
  - `pending: true` marca perfiles con datos por completar.
- **Colores:** usar siempre las clases `brand-*` (definidas en `tailwind.config.cjs`) en vez de `blue-*`.

## Publicaciones (NASA ADS)

Las publicaciones se leen de la biblioteca pública de ADS (`site.json → ads.libraryId`) **al compilar**. El token nunca llega al navegador.

1. Genera un token en <https://ui.adsabs.harvard.edu> → *Account* → *Settings* → *API Token*. La biblioteca tiene que ser pública o pertenecer a la cuenta del token.
2. Copia `.env.example` como `.env` y completa `ADS_API_KEY=...`.
3. Ejecuta `npm run build`. Cada build trae la lista actualizada; para que se actualice sola basta con programar un build diario en el servidor.

### Lista manual (sin token)

Sin token, o si ADS falla, el sitio usa `src/data/publications.json`. Para agregar un paper:

1. Agrégalo primero a la biblioteca en ADS, para que ambas fuentes coincidan.
2. Copia una entrada de `publications.json` y completa `bibcode`, `title`, `authors` (formato `"Apellido, N."`), `journal`, `year`, `date`, `doi`, `arxiv`, `citations` y `refereed`. Todos los datos están en la página del paper en ADS.
3. Actualiza `updatedAt` y ejecuta `npm run build`.

La lista manual no incluye los resúmenes; esos se cargan solo cuando se usa el token.

## Despliegue

Actualmente en Netlify (`npm run build`, carpeta `dist/`). La migración a un servidor propio está pendiente.
