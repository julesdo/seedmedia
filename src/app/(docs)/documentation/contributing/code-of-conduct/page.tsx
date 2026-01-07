import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function CodeOfConductPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Code de conduite</h1>
        <p className="text-lg text-muted-foreground">
          Nos attentes envers tous les contributeurs de Seed
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Notre engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pour favoriser un environnement ouvert et accueillant, nous nous engageons à faire de la participation 
              à notre projet et à notre communauté une expérience sans harcèlement pour tous, indépendamment de l'âge, 
              de la taille corporelle, du handicap, de l'origine ethnique, de l'identité et de l'expression de genre, 
              du niveau d'expérience, de la nationalité, de l'apparence personnelle, de la race, de la religion ou de 
              l'identité et de l'orientation sexuelles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comportements attendus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Utiliser un langage accueillant et inclusif</li>
              <li>Respecter les différents points de vue et expériences</li>
              <li>Accepter gracieusement les critiques constructives</li>
              <li>Se concentrer sur ce qui est le mieux pour la communauté</li>
              <li>Faire preuve d'empathie envers les autres membres de la communauté</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

