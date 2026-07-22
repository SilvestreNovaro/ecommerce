import type { Metadata } from "next";
import Link from "next/link";
import SectionBanner from "@/components/shop/section-banner";
import { getBannerSlides } from "@/lib/banners";
import { getPetPhotos } from "@/lib/pet-gallery";

export const metadata: Metadata = {
  title: "Galería Mascotas",
  description:
    "La galería de la familia Nalika: las mascotas de nuestros clientes disfrutando sus productos.",
};

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const [slides, photos] = await Promise.all([getBannerSlides("galeria"), getPetPhotos()]);
  return (
    <>
      <SectionBanner slides={slides} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-8 text-center sm:mb-10">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Galería Mascotas 🐾</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60 sm:text-base">
            Los que ya son parte de la familia Nalika.{" "}
            <Link href="/productos" className="font-semibold text-brand hover:underline">
              Encontrá algo para tu mascota
            </Link>
            .
          </p>
        </header>

        {photos.length === 0 ? (
          <p className="text-center text-ink/50">
            Todavía no hay fotos en la galería. ¡Muy pronto vas a conocer a la familia Nalika!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <figure key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-square w-full rounded-2xl bg-sand object-cover shadow-sm"
                />
                {photo.alt && (
                  <figcaption className="mt-2 text-center text-sm text-ink/60">
                    {photo.alt}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
