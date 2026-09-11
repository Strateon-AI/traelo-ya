/**
 * Foto real del proceso de envío (avión, cajas con la marca, banderas
 * EEUU/Bolivia) — reemplaza la composición ilustrada que había antes como
 * placeholder. Va con un velo blanco encima para que el título y el texto
 * de la izquierda sigan siendo legibles; a la derecha, donde está la
 * tarjeta del cotizador (que tiene su propio fondo blanco), se deja ver
 * más de la foto.
 */
export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-white">
      <img
        src="/hero-photo.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/70" />
    </div>
  );
}
