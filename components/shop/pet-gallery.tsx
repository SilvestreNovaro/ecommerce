import Link from "next/link";
import CardCarousel from "@/components/shop/card-carousel";
import type { PetPhoto } from "@/lib/pet-gallery";

// Sección "Galería Mascotas" de la home (réplica de Suk Comunidad):
// grilla 2×3 en desktop, carrusel con autoplay en mobile/tablet. Si no hay
// fotos activas, no renderiza nada.
// Foto con el nombre de la mascota visible encima (degradé abajo + nombre).
export function PhotoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="aspect-square w-full bg-sand object-cover" />
      {alt && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-4 pb-3 pt-10">
          <span className="font-display text-base font-bold text-white drop-shadow">{alt}</span>
        </figcaption>
      )}
    </figure>
  );
}

export default function PetGallery({ photos }: { photos: PetPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">Galería Mascotas 🐾</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60 sm:text-base">
            Los que ya son parte de la familia Nalika.
          </p>
        </div>

        {/* Mobile/tablet: carrusel */}
        <div className="md:hidden">
          <CardCarousel
            ariaLabel="Galería Mascotas"
            items={photos.map((photo) => (
              <PhotoCard key={photo.id} src={photo.src} alt={photo.alt} />
            ))}
          />
        </div>

        {/* Desktop: grilla 2×3 */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} src={photo.src} alt={photo.alt} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/galeria"
            className="inline-block rounded-full border border-brand px-8 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Ver toda la galería
          </Link>
        </div>
      </div>
    </section>
  );
}
