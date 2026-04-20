"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Building2, Loader2 } from "lucide-react";

interface CompanyResult {
  siren: string;
  nom_complet: string;
  siege: {
    adresse: string;
    code_postal: string;
    libelle_commune: string;
  };
  nature_juridique: string;
  date_creation: string;
  activite_principale: string;
  dirigeants: Array<{
    nom: string;
    prenoms: string;
    qualite: string;
  }>;
  nombre_etablissements: number;
  tranche_effectif_salarie: string;
}

interface CompanySearchProps {
  onSelect: (company: {
    denomination: string;
    siren: string;
    formeJuridique: string;
    siegeSocial: string;
    dateCreation: string;
    dirigeants: string;
    secteurActivite: string;
  }) => void;
  initialValue?: string;
}

// Mapping des codes nature juridique vers libellés
const NATURE_JURIDIQUE_MAP: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5485": "SA",
  "5499": "SA",
  "5505": "SA",
  "5510": "SA",
  "5551": "SA",
  "5553": "SA",
  "5554": "SA",
  "5555": "SA",
  "5560": "SA",
  "5599": "SA",
  "5610": "SARL",
  "5699": "SARL",
  "5800": "SARL",
  "5710": "SAS",
  "5720": "SASU",
  "5306": "EURL",
  "5307": "EURL",
  "5308": "EURL",
  "5660": "SNC",
  "6220": "GIE",
  "6540": "SCI",
  "6541": "SCI",
  "6543": "SCI",
  "9220": "Association",
  "9221": "Association",
  "9222": "Association",
  "9230": "Association",
  "9240": "Association",
};

function mapNatureJuridique(code: string): string {
  if (NATURE_JURIDIQUE_MAP[code]) return NATURE_JURIDIQUE_MAP[code];
  if (code.startsWith("57")) return "SAS";
  if (code.startsWith("56")) return "SARL";
  if (code.startsWith("54") || code.startsWith("55")) return "SA";
  if (code.startsWith("65")) return "SCI";
  if (code.startsWith("53")) return "EURL";
  if (code.startsWith("92")) return "Association";
  return code;
}

export function CompanySearch({ onSelect, initialValue }: CompanySearchProps) {
  const [query, setQuery] = useState(initialValue || "");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=8`
        );
        const data = await res.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch (err) {
        console.error("Erreur recherche entreprise:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(company: CompanyResult) {
    const dirigeantsStr = (company.dirigeants || [])
      .slice(0, 3)
      .map((d) => `${d.prenoms} ${d.nom} (${d.qualite})`)
      .join(", ");

    const adresse = company.siege
      ? `${company.siege.adresse || ""}, ${company.siege.code_postal || ""} ${company.siege.libelle_commune || ""}`.trim()
      : "";

    onSelect({
      denomination: company.nom_complet,
      siren: company.siren,
      formeJuridique: mapNatureJuridique(company.nature_juridique || ""),
      siegeSocial: adresse.replace(/^,\s*/, ""),
      dateCreation: company.date_creation || "",
      dirigeants: dirigeantsStr,
      secteurActivite: company.activite_principale || "",
    });

    setQuery(company.nom_complet);
    setShowResults(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Rechercher une entreprise (nom, SIREN...)"
          className="pl-9 pr-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-sm border bg-popover shadow-lg max-h-80 overflow-y-auto">
          {results.map((company) => (
            <button
              key={company.siren}
              type="button"
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b last:border-b-0"
              onClick={() => handleSelect(company)}
            >
              <Building2 className="mt-0.5 size-4 shrink-0 text-gold" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {company.nom_complet}
                </p>
                <p className="text-xs text-muted-foreground">
                  SIREN : {company.siren}
                  {company.nature_juridique && (
                    <> · {mapNatureJuridique(company.nature_juridique)}</>
                  )}
                </p>
                {company.siege?.libelle_commune && (
                  <p className="text-xs text-muted-foreground">
                    {company.siege.libelle_commune}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !isSearching && (
        <div className="absolute z-50 mt-1 w-full rounded-sm border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
          Aucune entreprise trouvée
        </div>
      )}
    </div>
  );
}
