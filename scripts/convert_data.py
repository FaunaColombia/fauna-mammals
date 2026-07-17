"""
convert_data.py
----------------
Convierte el Excel de la Mammal Diversity Database (MDD) en el archivo
data/mammals.json que usa la página web.

CUANDO USARLO:
- Cada vez que tengas una version nueva del Excel de especies
  (por ejemplo "mammals_2027.xlsx" el proximo año).

COMO USARLO:
1. Coloca tu archivo .xlsx en esta misma carpeta "scripts/"
   (o pasa la ruta completa como argumento).
2. Ejecuta:  python3 convert_data.py nombre_del_archivo.xlsx
3. Esto genera/actualiza automaticamente: ../data/mammals.json

NOTA IMPORTANTE:
Este script solo trae la TAXONOMIA (nombre cientifico, comun, orden,
familia, genero, especie, distribucion, estado UICN, etc).
Las FOTOS, creditos y links se manejan en un archivo aparte
(js/photos-config.js) para que nunca se pierdan al actualizar la
lista de especies. Si conviertes un Excel nuevo, tus fotos siguen
intactas.
"""

import sys
import json
import re
import unicodedata
import pandas as pd


def slugify(sci_name: str) -> str:
    """Convierte 'Ornithorhynchus_anatinus' en un id simple y estable:
    'ornithorhynchus-anatinus'. Este id es la LLAVE que conecta cada
    especie con su foto en photos-config.js, asi que nunca cambia
    aunque cambien otros datos."""
    txt = sci_name.strip().lower().replace("_", "-").replace(" ", "-")
    txt = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    txt = re.sub(r"[^a-z0-9\-]", "", txt)
    return txt


def split_list(value) -> list:
    """Los campos de paises/continentes vienen separados por '|' en el
    Excel. Esto los convierte en una lista real: 'Peru|Ecuador' -> ['Peru','Ecuador']"""
    if pd.isna(value) or not str(value).strip():
        return []
    return [v.strip() for v in str(value).split("|") if v.strip()]


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 convert_data.py archivo.xlsx")
        sys.exit(1)

    src = sys.argv[1]
    df = pd.read_excel(src)

    species = []
    for _, row in df.iterrows():
        sci_name = str(row["sciName"]).replace("_", " ")
        species.append({
            "id": slugify(str(row["sciName"])),
            "sciName": sci_name,
            "commonName": row.get("mainCommonName") if pd.notna(row.get("mainCommonName")) else "",
            "order": row.get("order") if pd.notna(row.get("order")) else "",
            "family": row.get("family") if pd.notna(row.get("family")) else "",
            "genus": row.get("genus") if pd.notna(row.get("genus")) else "",
            "species": row.get("specificEpithet") if pd.notna(row.get("specificEpithet")) else "",
            "author": row.get("authoritySpeciesAuthor") if pd.notna(row.get("authoritySpeciesAuthor")) else "",
            "year": int(row["authoritySpeciesYear"]) if pd.notna(row.get("authoritySpeciesYear")) else None,
            "countries": split_list(row.get("countryDistribution")),
            "continents": split_list(row.get("continentDistribution")),
            "realm": split_list(row.get("biogeographicRealm")),
            "iucnStatus": (row.get("iucnStatus") or "").split(" ")[0] if pd.notna(row.get("iucnStatus")) else "NE",
            "extinct": bool(row.get("extinct")) if pd.notna(row.get("extinct")) else False,
            "domestic": bool(row.get("domestic")) if pd.notna(row.get("domestic")) else False,
        })

    out_path = "../data/mammals.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(species, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Listo: {len(species)} especies escritas en {out_path}")


if __name__ == "__main__":
    main()
