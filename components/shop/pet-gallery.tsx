import Link from "next/link";
import CardCarousel from "@/components/shop/card-carousel";
import type { PetPhoto } from "@/lib/pet-gallery";

// Sección "Galería Mascotas" de la home (réplica de Suk Comunidad):
// grilla 2×3 en desktop, carrusel con autoplay en mobile/tablet. Si no hay
// fotos activas, no renderiza nada.
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="aspect-square w-full rounded-2xl bg-sand object-cover shadow-sm"
              />
            ))}
          />
        </div>

        {/* Desktop: grilla 2×3 */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
          {photos.map((photo) => (
            <figure key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="aspect-square w-full rounded-2xl bg-sand object-cover shadow-sm"
              />
            </figure>
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
