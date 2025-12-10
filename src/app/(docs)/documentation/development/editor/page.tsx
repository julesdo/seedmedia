"use client";

import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";

// Contenu de l'article qui exploite toutes les fonctionnalités de l'éditeur
const editorContent = [
  {
    type: "h1",
    children: [{ text: "Guide complet de l'éditeur Seed" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur Seed est un éditeur de texte riche basé sur Plate.js qui offre des fonctionnalités avancées pour créer du contenu scientifique, technique et éducatif. Ce guide vous présente toutes ses capacités.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "Fonctionnalités principales" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur Seed supporte de nombreux formats et types de contenu :",
      },
    ],
  },
  {
    type: "ul",
    children: [
      {
        type: "li",
        children: [{ text: "Code blocks avec syntax highlighting" }],
      },
      {
        type: "li",
        children: [{ text: "Diagrammes Mermaid (flowcharts, séquences, etc.)" }],
      },
      {
        type: "li",
        children: [{ text: "Visualisation de molécules 3D (SDF, PDB, SMILES)" }],
      },
      {
        type: "li",
        children: [{ text: "Graphiques Vega et Vega-Lite" }],
      },
      {
        type: "li",
        children: [{ text: "Formules mathématiques LaTeX" }],
      },
      {
        type: "li",
        children: [{ text: "Tableaux interactifs" }],
      },
      {
        type: "li",
        children: [{ text: "Callouts et encadrés" }],
      },
      {
        type: "li",
        children: [{ text: "Colonnes et mises en page avancées" }],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "1. Code blocks avec syntax highlighting" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Les code blocks supportent plus de 50 langages de programmation avec coloration syntaxique automatique :",
      },
    ],
  },
  {
    type: "code_block",
    lang: "typescript",
    children: [
      {
        type: "code_line",
        children: [
          {
            text: "// Exemple TypeScript",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "interface EditorConfig {",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  readonly: boolean;",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  placeholder?: string;",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "}",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "const config: EditorConfig = {",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  readonly: false,",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  placeholder: 'Commencez à écrire...'",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "};",
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "2. Diagrammes Mermaid" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Les diagrammes Mermaid permettent de créer des graphiques complexes directement dans l'éditeur. Vous pouvez basculer entre le code, la vue diagramme, ou les deux côte à côte.",
      },
    ],
  },
  {
    type: "code_block",
    lang: "mermaid",
    meta: {
      mermaidMode: "split",
    },
    children: [
      {
        type: "code_line",
        children: [
          {
            text: "graph TD\n    A[Editeur Seed] --> B[Code Blocks]\n    A --> C[Mermaid Diagrams]\n    A --> D[Molecules 3D]\n    A --> E[Graphiques Vega]\n    B --> F[Syntax Highlighting]\n    C --> G[Flowcharts]\n    C --> H[Sequence Diagrams]\n    D --> I[SDF/PDB Viewer]\n    E --> J[Vega-Lite Charts]",
          },
        ],
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "Vous pouvez zoomer et déplacer les diagrammes Mermaid avec la souris ou le trackpad.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "3. Visualisation de molécules 3D" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur supporte la visualisation interactive de structures moléculaires en 3D. Les formats supportés sont :",
      },
    ],
  },
  {
    type: "ul",
    children: [
      {
        type: "li",
        children: [{ text: "SDF (Structure Data File)" }],
      },
      {
        type: "li",
        children: [{ text: "PDB (Protein Data Bank)" }],
      },
      {
        type: "li",
        children: [{ text: "SMILES (Simplified Molecular Input Line Entry System)" }],
      },
    ],
  },
  {
    type: "code_block",
    lang: "smiles",
    meta: {
      moleculeMode: "split",
    },
    children: [
      {
        type: "code_line",
        children: [
          {
            text: "CCO",
          },
        ],
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "La molécule ci-dessus est l'éthanol (CCO en notation SMILES). Vous pouvez interagir avec la visualisation 3D :",
      },
    ],
  },
  {
    type: "ul",
    children: [
      {
        type: "li",
        children: [{ text: "Clic-glisser pour faire tourner la molécule" }],
      },
      {
        type: "li",
        children: [{ text: "Molette de la souris pour zoomer" }],
      },
      {
        type: "li",
        children: [{ text: "Bouton de réinitialisation pour revenir à la vue par défaut" }],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "4. Graphiques Vega et Vega-Lite" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Vega et Vega-Lite permettent de créer des visualisations de données interactives et déclaratives. Voici un exemple de graphique en barres :",
      },
    ],
  },
  {
    type: "code_block",
    lang: "vega-lite",
    meta: {
      vegaMode: "split",
    },
    children: [
      {
        type: "code_line",
        children: [
          {
            text: '{',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '  "description": "Graphique montrant les fonctionnalités de l\'éditeur",',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '  "data": {',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '    "values": [',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '      {"feature": "Code Blocks", "count": 50},',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '      {"feature": "Mermaid", "count": 15},',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '      {"feature": "Molécules", "count": 3},',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '      {"feature": "Vega", "count": 10},',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '      {"feature": "Math", "count": 20}',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "    ]",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  },",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '  "mark": "bar",',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '  "encoding": {',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '    "x": {"field": "feature", "type": "ordinal", "title": "Fonctionnalité"},',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: '    "y": {"field": "count", "type": "quantitative", "title": "Nombre"}',
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "  }",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "}",
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "5. Formules mathématiques" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur supporte les formules mathématiques en LaTeX, à la fois en ligne et en bloc :",
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "Formule en ligne : ",
      },
      {
        text: "E = mc²",
        code: true,
      },
      {
        text: " ou ",
      },
      {
        text: "∫₀^∞ e^(-x²) dx = √π/2",
        code: true,
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "Formule en bloc :",
      },
    ],
  },
  {
    type: "code_block",
    lang: "latex",
    children: [
      {
        type: "code_line",
        children: [
          {
            text: "\\begin{equation}",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}",
          },
        ],
      },
      {
        type: "code_line",
        children: [
          {
            text: "\\end{equation}",
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "6. Tableaux" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Les tableaux sont entièrement interactifs et supportent le tri, le redimensionnement des colonnes, et la mise en forme :",
      },
    ],
  },
  {
    type: "table",
    children: [
      {
        type: "tr",
        children: [
          {
            type: "th",
            children: [{ text: "Fonctionnalité" }],
          },
          {
            type: "th",
            children: [{ text: "Format supporté" }],
          },
          {
            type: "th",
            children: [{ text: "Interactivité" }],
          },
        ],
      },
      {
        type: "tr",
        children: [
          {
            type: "td",
            children: [{ text: "Code Blocks" }],
          },
          {
            type: "td",
            children: [{ text: "50+ langages" }],
          },
          {
            type: "td",
            children: [{ text: "Copie, formatage" }],
          },
        ],
      },
      {
        type: "tr",
        children: [
          {
            type: "td",
            children: [{ text: "Mermaid" }],
          },
          {
            type: "td",
            children: [{ text: "Flowcharts, séquences" }],
          },
          {
            type: "td",
            children: [{ text: "Zoom, pan" }],
          },
        ],
      },
      {
        type: "tr",
        children: [
          {
            type: "td",
            children: [{ text: "Molécules" }],
          },
          {
            type: "td",
            children: [{ text: "SDF, PDB, SMILES" }],
          },
          {
            type: "td",
            children: [{ text: "Rotation 3D, zoom" }],
          },
        ],
      },
      {
        type: "tr",
        children: [
          {
            type: "td",
            children: [{ text: "Vega" }],
          },
          {
            type: "td",
            children: [{ text: "JSON spec" }],
          },
          {
            type: "td",
            children: [{ text: "Interactif, export" }],
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "7. Callouts et encadrés" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Les callouts permettent de mettre en évidence des informations importantes :",
      },
    ],
  },
  {
    type: "callout",
    variant: "info",
    children: [
      {
        type: "callout_title",
        children: [{ text: "Astuce" }],
      },
      {
        type: "callout_content",
        children: [
          {
            type: "p",
            children: [
              {
                text: "Vous pouvez basculer entre les différents modes d'affichage (code, preview, split) pour chaque type de contenu en utilisant les boutons dans la barre d'outils du code block.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "callout",
    variant: "warning",
    children: [
      {
        type: "callout_title",
        children: [{ text: "Important" }],
      },
      {
        type: "callout_content",
        children: [
          {
            type: "p",
            children: [
              {
                text: "Les visualisations 3D et les graphiques nécessitent JavaScript pour fonctionner. Assurez-vous que JavaScript est activé dans votre navigateur.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "callout",
    variant: "success",
    children: [
      {
        type: "callout_title",
        children: [{ text: "Succès" }],
      },
      {
        type: "callout_content",
        children: [
          {
            type: "p",
            children: [
              {
                text: "L'éditeur Seed est entièrement open source et contribue à rendre l'information scientifique plus accessible.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "8. Colonnes et mises en page" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Vous pouvez organiser votre contenu en colonnes pour créer des mises en page complexes :",
      },
    ],
  },
  {
    type: "column_group",
    children: [
      {
        type: "column",
        children: [
          {
            type: "h3",
            children: [{ text: "Colonne 1" }],
          },
          {
            type: "p",
            children: [
              {
                text: "Le contenu peut être organisé en colonnes pour améliorer la lisibilité et la présentation.",
              },
            ],
          },
        ],
      },
      {
        type: "column",
        children: [
          {
            type: "h3",
            children: [{ text: "Colonne 2" }],
          },
          {
            type: "p",
            children: [
              {
                text: "Chaque colonne peut contenir n'importe quel type de contenu supporté par l'éditeur.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "9. Liens et médias" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur supporte les liens, images et vidéos avec aperçu automatique :",
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "Exemple de lien vers ",
      },
      {
        type: "a",
        url: "https://platejs.org",
        children: [{ text: "Plate.js" }],
      },
      {
        text: ", le framework sous-jacent de l'éditeur.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "10. Mode lecture seule" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur peut fonctionner en mode lecture seule, parfait pour afficher du contenu sans permettre la modification. Toutes les fonctionnalités de visualisation restent actives.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "Conclusion" }],
  },
  {
    type: "p",
    children: [
      {
        text: "L'éditeur Seed est un outil puissant qui combine la simplicité d'un éditeur de texte riche avec les capacités avancées nécessaires pour créer du contenu scientifique et technique de qualité. Que vous écriviez des articles, de la documentation, ou des tutoriels, l'éditeur Seed vous offre tous les outils dont vous avez besoin.",
      },
    ],
  },
  {
    type: "p",
    children: [
      {
        text: "Pour en savoir plus sur l'utilisation de l'éditeur dans vos propres projets, consultez la ",
      },
      {
        type: "a",
        url: "/documentation/development/api",
        children: [{ text: "documentation de l'API" }],
      },
      {
        text: ".",
      },
    ],
  },
];

export default function EditorDocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <SolarIcon icon="code-bold" className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Guide de l'éditeur Seed</h1>
            <p className="text-muted-foreground mt-2">
              Découvrez toutes les fonctionnalités de l'éditeur de texte riche
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline">Plate.js</Badge>
          <Badge variant="outline">React</Badge>
          <Badge variant="outline">TypeScript</Badge>
          <Badge variant="outline">Mermaid</Badge>
          <Badge variant="outline">Vega</Badge>
          <Badge variant="outline">3Dmol.js</Badge>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>À propos de cet article</CardTitle>
          <CardDescription>
            Cet article de documentation utilise toutes les fonctionnalités de l'éditeur Seed pour vous montrer ce qu'il est possible de faire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous pouvez interagir avec tous les éléments interactifs : diagrammes Mermaid, molécules 3D, graphiques Vega, etc. 
            Cet article est en mode lecture seule, mais dans l'éditeur complet, vous pouvez modifier tous ces éléments.
          </p>
        </CardContent>
      </Card>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <PlateEditorWrapper
          value={JSON.stringify(editorContent)}
          readOnly={true}
          placeholder=""
        />
      </div>
    </div>
  );
}

