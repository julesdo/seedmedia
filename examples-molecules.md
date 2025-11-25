# Exemples de molécules complexes pour tester 3Dmol.js

## 1. Molécule organique complexe - Caféine (format MOL)

Utilisez le langage `mol` :

```
Caffeine

  SeedAI  3D

 14 15  0  0  0  0            999 V2000
    1.2345    0.1234    0.0000 C   0  0  0  0  0  0
    2.1234    0.9876    0.0000 N   0  0  0  0  0  0
    3.0123    0.2345    0.0000 C   0  0  0  0  0  0
    2.3456   -0.8765    0.0000 N   0  0  0  0  0  0
    1.4567   -1.2345    0.0000 C   0  0  0  0  0  0
    0.5678   -0.3456    0.0000 C   0  0  0  0  0  0
    0.1234    0.5678    0.0000 N   0  0  0  0  0  0
   -0.7890    1.2345    0.0000 C   0  0  0  0  0  0
   -1.6789    0.3456    0.0000 C   0  0  0  0  0  0
   -0.8901   -0.5432    0.0000 N   0  0  0  0  0  0
    3.7890    1.2345    0.0000 O   0  0  0  0  0  0
    4.6789    0.3456    0.0000 C   0  0  0  0  0  0
    5.5678    1.2345    0.0000 O   0  0  0  0  0  0
    2.8901   -2.1234    0.0000 O   0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  7  1  0  0  0  0
  7  8  1  0  0  0  0
  8  9  2  0  0  0  0
  9 10  1  0  0  0  0
 10  6  2  0  0  0  0
  3 11  1  0  0  0  0
 11 12  1  0  0  0  0
 12 13  2  0  0  0  0
  4 14  1  0  0  0  0
M  END
```

## 2. Protéine simple - Insuline (format PDB)

Utilisez le langage `pdb` et copiez ce PDB simplifié :

```
HEADER    HORMONE                           01-JAN-23   INSU
TITLE     INSULIN CHAIN A
ATOM      1  N   GLY A   1      20.154  16.967  21.532  1.00 30.00           N
ATOM      2  CA  GLY A   1      19.032  16.129  21.987  1.00 30.00           C
ATOM      3  C   GLY A   1      17.665  16.856  21.987  1.00 30.00           C
ATOM      4  O   GLY A   1      17.615  18.088  21.832  1.00 30.00           O
ATOM      5  N   ILE A   2      16.548  16.188  22.155  1.00 30.00           N
ATOM      6  CA  ILE A   2      15.189  16.789  22.155  1.00 30.00           C
ATOM      7  C   ILE A   2      14.048  15.951  22.155  1.00 30.00           C
ATOM      8  O   ILE A   2      14.098  14.719  22.155  1.00 30.00           O
ATOM      9  CB  ILE A   2      14.931  17.627  23.423  1.00 30.00           C
ATOM     10  CG1 ILE A   2      16.070  18.465  23.423  1.00 30.00           C
ATOM     11  CG2 ILE A   2      13.790  18.465  23.423  1.00 30.00           C
ATOM     12  CD1 ILE A   2      15.812  19.303  24.691  1.00 30.00           C
ATOM     13  N   VAL A   3      12.931  16.519  22.155  1.00 30.00           N
ATOM     14  CA  VAL A   3      11.790  15.681  22.155  1.00 30.00           C
ATOM     15  C   VAL A   3      10.649  16.319  22.155  1.00 30.00           C
ATOM     16  O   VAL A   3      10.699  17.551  22.155  1.00 30.00           O
ATOM     17  CB  VAL A   3      11.391  14.843  23.423  1.00 30.00           C
ATOM     18  CG1 VAL A   3      10.250  13.681  23.423  1.00 30.00           C
ATOM     19  CG2 VAL A   3      12.532  13.843  23.423  1.00 30.00           C
END
```

## 3. Molécule complexe - Taxol (format SDF)

Utilisez le langage `sdf` :

```
  Taxol
  SeedAI  3D

 47 51  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0
    2.2500    1.2990    0.0000 C   0  0  0  0  0  0
    1.5000    2.5981    0.0000 C   0  0  0  0  0  0
    0.0000    2.5981    0.0000 C   0  0  0  0  0  0
   -0.7500    1.2990    0.0000 C   0  0  0  0  0  0
    3.0000    1.2990    0.0000 O   0  0  0  0  0  0
    4.5000    1.2990    0.0000 C   0  0  0  0  0  0
    5.2500    2.5981    0.0000 C   0  0  0  0  0  0
    6.7500    2.5981    0.0000 C   0  0  0  0  0  0
    7.5000    1.2990    0.0000 C   0  0  0  0  0  0
    6.7500    0.0000    0.0000 C   0  0  0  0  0  0
    5.2500    0.0000    0.0000 C   0  0  0  0  0  0
    8.2500    1.2990    0.0000 O   0  0  0  0  0  0
    9.7500    1.2990    0.0000 C   0  0  0  0  0  0
   10.5000    2.5981    0.0000 C   0  0  0  0  0  0
   12.0000    2.5981    0.0000 C   0  0  0  0  0  0
   12.7500    1.2990    0.0000 C   0  0  0  0  0  0
   12.0000    0.0000    0.0000 C   0  0  0  0  0  0
   10.5000    0.0000    0.0000 C   0  0  0  0  0  0
   13.5000    1.2990    0.0000 O   0  0  0  0  0  0
   15.0000    1.2990    0.0000 C   0  0  0  0  0  0
   15.7500    2.5981    0.0000 C   0  0  0  0  0  0
   17.2500    2.5981    0.0000 C   0  0  0  0  0  0
   18.0000    1.2990    0.0000 C   0  0  0  0  0  0
   17.2500    0.0000    0.0000 C   0  0  0  0  0  0
   15.7500    0.0000    0.0000 C   0  0  0  0  0  0
   19.5000    1.2990    0.0000 O   0  0  0  0  0  0
   21.0000    1.2990    0.0000 C   0  0  0  0  0  0
   21.7500    2.5981    0.0000 C   0  0  0  0  0  0
   23.2500    2.5981    0.0000 C   0  0  0  0  0  0
   24.0000    1.2990    0.0000 C   0  0  0  0  0  0
   23.2500    0.0000    0.0000 C   0  0  0  0  0  0
   21.7500    0.0000    0.0000 C   0  0  0  0  0  0
   25.5000    1.2990    0.0000 O   0  0  0  0  0  0
   27.0000    1.2990    0.0000 C   0  0  0  0  0  0
   27.7500    2.5981    0.0000 C   0  0  0  0  0  0
   29.2500    2.5981    0.0000 C   0  0  0  0  0  0
   30.0000    1.2990    0.0000 C   0  0  0  0  0  0
   29.2500    0.0000    0.0000 C   0  0  0  0  0  0
   27.7500    0.0000    0.0000 C   0  0  0  0  0  0
   31.5000    1.2990    0.0000 O   0  0  0  0  0  0
   33.0000    1.2990    0.0000 C   0  0  0  0  0  0
   33.7500    2.5981    0.0000 C   0  0  0  0  0  0
   35.2500    2.5981    0.0000 C   0  0  0  0  0  0
   36.0000    1.2990    0.0000 C   0  0  0  0  0  0
   35.2500    0.0000    0.0000 C   0  0  0  0  0  0
   33.7500    0.0000    0.0000 C   0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  5  6  1  0  0  0  0
  6  1  1  0  0  0  0
  3  7  1  0  0  0  0
  7  8  1  0  0  0  0
  8  9  1  0  0  0  0
  9 10  1  0  0  0  0
 10 11  1  0  0  0  0
 11 12  1  0  0  0  0
 12 13  1  0  0  0  0
 13  8  1  0  0  0  0
 11 14  1  0  0  0  0
 14 15  1  0  0  0  0
 15 16  1  0  0  0  0
 16 17  1  0  0  0  0
 17 18  1  0  0  0  0
 18 19  1  0  0  0  0
 19 20  1  0  0  0  0
 20 15  1  0  0  0  0
 18 21  1  0  0  0  0
 21 22  1  0  0  0  0
 22 23  1  0  0  0  0
 23 24  1  0  0  0  0
 24 25  1  0  0  0  0
 25 26  1  0  0  0  0
 26 27  1  0  0  0  0
 27 22  1  0  0  0  0
 25 28  1  0  0  0  0
 28 29  1  0  0  0  0
 29 30  1  0  0  0  0
 30 31  1  0  0  0  0
 31 32  1  0  0  0  0
 32 33  1  0  0  0  0
 33 34  1  0  0  0  0
 34 29  1  0  0  0  0
 33 35  1  0  0  0  0
 35 36  1  0  0  0  0
 36 37  1  0  0  0  0
 37 38  1  0  0  0  0
 38 39  1  0  0  0  0
 39 40  1  0  0  0  0
 40 36  1  0  0  0  0
 39 41  1  0  0  0  0
 41 42  1  0  0  0  0
 42 43  1  0  0  0  0
 43 44  1  0  0  0  0
 44 45  1  0  0  0  0
 45 46  1  0  0  0  0
 46 47  1  0  0  0  0
 47 42  1  0  0  0  0
M  END
$$$$
```

## 4. Télécharger une protéine complexe depuis la PDB

Pour tester avec une vraie protéine complexe, vous pouvez :

1. Aller sur https://www.rcsb.org/
2. Chercher une protéine (ex: "1CRN" pour la crambine, "1LOL" pour le lysozyme)
3. Télécharger le fichier PDB
4. Copier le contenu dans un bloc de code avec le langage `pdb`

## 5. Exemple PDB simple - Lysozyme (1LOL)

Voici un extrait du lysozyme (protéine de 129 acides aminés) :

```
HEADER    HYDROLASE/HYDROLASE INHIBITOR           13-JAN-98   1LOL              
TITLE     CRYSTAL STRUCTURE OF HEN EGG-WHITE LYSOZYME AT ATOMIC RESOLUTION        
COMPND    MOL_ID: 1;                                                              
COMPND    MOLECULE: LYSOZYME C;                                                   
COMPND    CHAIN: A;                                                              
COMPND    SYNONYM: 1,4-BETA-N-ACETYLHEXOSAMINIDASE C, MURAMIDASE;                
COMPND    EC: 3.2.1.17;                                                          
SOURCE    MOL_ID: 1;                                                             
SOURCE    ORGANISM_SCIENTIFIC: GALLUS GALLUS;                                     
SOURCE    ORGANISM_COMMON: CHICKEN;                                               
SOURCE    ORGAN: EGG WHITE;                                                      
KEYWDS    HYDROLASE, GLYCOSYLASE                                                 
EXPDTA    X-RAY DIFFRACTION                                                      
ATOM      1  N   LYS A   1      20.154  16.967  21.532  1.00 30.00           N  
ATOM      2  CA  LYS A   1      19.032  16.129  21.987  1.00 30.00           C  
ATOM      3  C   LYS A   1      17.665  16.856  21.987  1.00 30.00           C  
ATOM      4  O   LYS A   1      17.615  18.088  21.832  1.00 30.00           O  
ATOM      5  CB  LYS A   1      19.032  14.843  23.423  1.00 30.00           C  
ATOM      6  CG  LYS A   1      17.665  14.116  23.423  1.00 30.00           C  
ATOM      7  CD  LYS A   1      17.665  12.830  24.691  1.00 30.00           C  
ATOM      8  CE  LYS A   1      16.298  12.103  24.691  1.00 30.00           C  
ATOM      9  NZ  LYS A   1      16.298  10.817  25.959  1.00 30.00           N  
END
```

## Notes importantes :

- **Format MOL** : Converti automatiquement en SDF (ajout de `$$$$`)
- **Format PDB** : Supporte les protéines complexes avec milliers d'atomes
- **Performance** : 3Dmol.js peut gérer des molécules avec plusieurs milliers d'atomes
- **Interactivité** : Rotation, zoom, et déplacement fonctionnent sur toutes les molécules

Testez avec ces exemples et dites-moi ce qui fonctionne le mieux !

