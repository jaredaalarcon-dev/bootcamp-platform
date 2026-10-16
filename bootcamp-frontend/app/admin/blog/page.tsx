// src/app/admin/blog/page.tsx
// Administración del blog: publicaciones enlazadas a las redes de la empresa,
// videos del canal de YouTube para elegir cuáles publicar y lista de suscriptores.
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useBlogApi, PostBlog, RedBlog, REDES_BLOG, DatosPost, VideoYoutube } from "@/hooks/useBlogApi";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { REDES } from "@/lib/social";

const hoy = () => new Date().toISOString().slice(0, 10);
const VACIO = { title: "", summary: "", network: "facebook" as RedBlog, category: "", imageUrl: "", url: "", publishedAt: hoy(), isPublished: true };
const CATEGORIAS = ["Tecnología", "Cursos", "Consejos", "Eventos", "Noticias", "Proyectos"];

function IconoRed({ red }: { red: RedBlog }) {
  const r = REDES.find((x) => x.red === red);
  if (!r) return <img src="/brand/icono-sijb.png" alt="" className="w-9 h-9 rounded-lg bg-[#0d0d0d] p-1 shrink-0" />;
  return <SocialIcon red={r.red} color={r.color} tile className="w-9 h-9" />;
}

export default function AdminBlogPage() {
  const { getPosts, createPost, updatePost, deletePost, getSubscribers, getYoutube } = useBlogApi();
  const [posts, setPosts] = useState<PostBlog[]>([]);
  const [subs, setSubs] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [videos, setVideos] = useState<VideoYoutube[]>([]);
  const [cargandoYt, setCargandoYt] = useState(true);
  const [publicando, setPublicando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [verSubs, setVerSubs] = useState(false);

  const cargar = async () => {
    const [p, s] = await Promise.all([getPosts(), getSubscribers()]);
    if (!p.success) toast.error(p.error || "Error al cargar");
    setPosts(p.data);
    setSubs(s.data);
    setCargando(false);
    // Los videos de YouTube tardan un poco más: se cargan aparte
    const y = await getYoutube();
    setVideos(y.data);
    setCargandoYt(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof typeof VACIO>(k: K, v: (typeof VACIO)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const limpiar = () => { setForm({ ...VACIO, publishedAt: hoy() }); setEditando(null); };

  const editar = (p: PostBlog) => {
    setEditando(p.id);
    setForm({
      title: p.title,
      summary: p.summary ?? "",
      network: p.network,
      category: p.category ?? "",
      imageUrl: p.imageUrl ?? "",
      url: p.url,
      publishedAt: p.publishedAt.slice(0, 10),
      isPublished: p.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Escribe un título"); return; }
    if (!/^https?:\/\//i.test(form.url.trim())) { toast.error("Pega el enlace de la publicación (https://...)"); return; }

    const datos: DatosPost = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      network: form.network,
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      url: form.url.trim(),
      // Mediodía para que la fecha no cambie de día por la zona horaria
      publishedAt: new Date(`${form.publishedAt}T12:00:00`).toISOString(),
      isPublished: form.isPublished,
    };

    setGuardando(true);
    const r = editando
      ? await updatePost(editando, { ...datos, imageUrl: form.imageUrl.trim() })
      : await createPost(datos);
    setGuardando(false);
    if (!r.success || !r.data) { toast.error(r.error || "No se pudo guardar"); return; }

    setPosts((prev) => {
      const lista = editando ? prev.map((x) => (x.id === editando ? r.data! : x)) : [r.data!, ...prev];
      return lista.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    });
    setVideos((prev) => prev.map((v) => (datos.url.includes(v.videoId) ? { ...v, added: true } : v)));
    toast.success(editando ? "Publicación actualizada" : "Publicación agregada al blog");
    limpiar();
  };

  // Copia los datos del video al formulario para revisarlos antes de publicar
  const prepararVideo = (v: VideoYoutube) => {
    setEditando(null);
    setForm({
      title: v.title,
      summary: v.summary.split("\n").filter(Boolean).slice(0, 3).join(" ").slice(0, 600),
      network: "youtube",
      category: "Video",
      imageUrl: v.imageUrl,
      url: v.url,
      publishedAt: (v.publishedAt || new Date().toISOString()).slice(0, 10),
      isPublished: true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Revisa los datos y presiona «Publicar en el blog»", { icon: "✏️" });
  };

  const publicarVideo = async (v: VideoYoutube) => {
    setPublicando(v.videoId);
    const r = await createPost({
      title: v.title,
      summary: v.summary.split("\n").filter(Boolean).slice(0, 3).join(" ").slice(0, 600),
      network: "youtube",
      category: "Video",
      imageUrl: v.imageUrl,
      url: v.url,
      publishedAt: v.publishedAt || undefined,
      isPublished: true,
    });
    setPublicando(null);
    if (!r.success || !r.data) { toast.error(r.error || "No se pudo publicar"); return; }
    setPosts((prev) => [r.data!, ...prev].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)));
    setVideos((prev) => prev.map((x) => (x.videoId === v.videoId ? { ...x, added: true } : x)));
    toast.success("Video publicado en el blog");
  };

  const alternar = async (p: PostBlog) => {
    const r = await updatePost(p.id, { isPublished: !p.isPublished });
    if (!r.success || !r.data) { toast.error(r.error || "No se pudo cambiar"); return; }
    setPosts((prev) => prev.map((x) => (x.id === p.id ? r.data! : x)));
  };

  const eliminar = async (p: PostBlog) => {
    if (!window.confirm(`¿Eliminar "${p.title}" del blog?`)) return;
    const r = await deletePost(p.id);
    if (!r.success) { toast.error(r.error || "No se pudo eliminar"); return; }
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    setVideos((prev) => prev.map((v) => (p.url.includes(v.videoId) ? { ...v, added: false } : v)));
    if (editando === p.id) limpiar();
    toast.success("Publicación eliminada");
  };

  const exportarCsv = () => {
    const filas = ["correo,fecha", ...subs.map((s) => `${s.email},${new Date(s.createdAt).toLocaleDateString("es-PE")}`)];
    const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "suscriptores-blog.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (cargando) return <div className="flex min-h-[60vh] items-center justify-center"><div className="spinner-cyan" /></div>;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Blog y Redes</h1>
            <p className="text-gray-500 text-sm mt-1">Publica en el blog lo que la empresa comparte en sus redes sociales.</p>
          </div>
          <a href="/blog" target="_blank" className="btn-cyan text-sm px-4 py-2">Ver blog ↗</a>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { v: posts.filter((p) => p.isPublished).length, l: "Publicaciones visibles" },
            { v: videos.filter((v) => !v.added).length, l: "Videos de YouTube por publicar" },
            { v: subs.length, l: "Suscriptores" },
          ].map((k) => (
            <div key={k.l} className="card-dark p-5">
              <p className="font-brand text-[#00C0E7] text-3xl leading-none">{k.v}</p>
              <p className="text-gray-500 text-xs mt-1.5">{k.l}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[rgba(0,192,231,0.25)] bg-[rgba(0,192,231,0.05)] p-4 text-sm text-gray-400">
          <span className="font-semibold text-[#00C0E7]">¿Cómo funciona?</span> Solo se muestra en el blog lo que publicas aquí.
          Los videos de tu canal de YouTube aparecen abajo: elige cuáles publicar (puedes editarlos antes).
          Para una publicación de Facebook, Instagram, LinkedIn o TikTok, cópiale el enlace (<em>Compartir → Copiar enlace</em>) y agrégala en el formulario.
        </div>

        {/* Formulario */}
        <form onSubmit={guardar} className="card-dark p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">{editando ? "Editar publicación" : "Agregar publicación"}</h2>
            {editando && <button type="button" onClick={limpiar} className="text-sm text-gray-400 hover:text-white">Cancelar edición</button>}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              <div>
                <label className="label-dark">Red social</label>
                <div className="flex flex-wrap gap-2">
                  {REDES_BLOG.map((r) => (
                    <button key={r.value} type="button" onClick={() => set("network", r.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        form.network === r.value ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-[rgba(0,192,231,0.3)] text-gray-400 hover:text-[#00C0E7]"
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-dark">Enlace de la publicación</label>
                <input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://www.instagram.com/p/..." className="input-dark" />
              </div>
              <div>
                <label className="label-dark">Título</label>
                <input type="text" value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} placeholder="Ej. Nuevo curso de Desarrollo Web con IA" className="input-dark" />
              </div>
              <div>
                <label className="label-dark">Resumen (opcional)</label>
                <textarea value={form.summary} maxLength={600} rows={3} onChange={(e) => set("summary", e.target.value)} placeholder="Dos o tres líneas que inviten a leer la publicación." className="input-dark resize-y" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Categoría (opcional)</label>
                  <input type="text" list="categorias-blog" value={form.category} maxLength={50} onChange={(e) => set("category", e.target.value)} placeholder="Tecnología, Cursos…" className="input-dark" />
                  <datalist id="categorias-blog">{CATEGORIAS.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="label-dark">Fecha de publicación</label>
                  <input type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="input-dark" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="accent-[#00C0E7] w-4 h-4" />
                Visible en el blog
              </label>
            </div>

            <div>
              <label className="label-dark">Imagen de portada</label>
              <ImageUpload currentUrl={form.imageUrl || undefined} onUpload={(url) => set("imageUrl", url)} disabled={guardando} />
              <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="…o pega la URL de una imagen" className="input-dark mt-2 text-xs" />
            </div>
          </div>

          <button type="submit" disabled={guardando} className="mt-6 btn-red px-6 py-2 text-sm">
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Publicar en el blog"}
          </button>
        </form>

        {/* Videos del canal de YouTube */}
        <div className="card-dark p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SocialIcon red="youtube" color="#FF0000" tile className="w-10 h-10" />
              <div>
                <h2 className="font-semibold text-white">Videos de tu canal de YouTube</h2>
                <p className="text-gray-500 text-xs mt-0.5">Los últimos videos del canal. Elige cuáles mostrar en el blog.</p>
              </div>
            </div>
            <a href={REDES.find((r) => r.red === "youtube")!.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#00C0E7] hover:underline">Abrir canal ↗</a>
          </div>

          {cargandoYt ? (
            <div className="py-10 flex justify-center"><div className="spinner-cyan" /></div>
          ) : videos.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">No se pudieron leer los videos del canal en este momento. Puedes agregarlos a mano con el formulario (red: YouTube).</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {videos.map((v) => (
                <div key={v.videoId} className="flex gap-3 rounded-lg border border-[rgba(0,192,231,0.15)] p-3">
                  <img src={v.imageUrl} alt="" className="w-28 h-[63px] rounded-md object-cover shrink-0 bg-gray-800" />
                  <div className="min-w-0 flex-1 flex flex-col">
                    <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">{v.title}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
                    <div className="mt-auto pt-2 flex items-center gap-3 text-xs font-semibold">
                      {v.added ? (
                        <span className="text-[#28c840]">✓ Publicado en el blog</span>
                      ) : (
                        <>
                          <button onClick={() => publicarVideo(v)} disabled={publicando === v.videoId} className="text-[#E31E24] hover:underline disabled:opacity-50">
                            {publicando === v.videoId ? "Publicando…" : "Publicar"}
                          </button>
                          <button onClick={() => prepararVideo(v)} className="text-gray-400 hover:text-[#00C0E7]">Editar y publicar</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista */}
        <div>
          <h2 className="font-brand text-white text-lg uppercase tracking-wide mb-1">Publicaciones</h2>
          <div className="h-[2px] w-10 bg-[#E31E24] rounded mb-4" />
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(0,192,231,0.3)] bg-[#111827] p-10 text-center">
              <p className="text-gray-400">Aún no hay publicaciones propias. Los videos de YouTube ya se muestran solos en el blog.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className={`card-dark p-4 flex items-center gap-4 ${p.isPublished ? "" : "opacity-60"}`}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0 bg-gray-800" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gray-800 flex items-center justify-center shrink-0"><IconoRed red={p.network} /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-[#00C0E7]">{REDES_BLOG.find((r) => r.value === p.network)?.label}</span>
                      {p.category && <span className="text-gray-500">· {p.category}</span>}
                      <span className="text-gray-500">· {new Date(p.publishedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {!p.isPublished && <span className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">Oculta</span>}
                    </div>
                    <p className="text-white font-semibold text-sm mt-0.5 truncate">{p.title}</p>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs truncate block hover:text-[#00C0E7]">{p.url}</a>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => alternar(p)} className="rounded px-2 py-1 text-xs font-semibold text-gray-400 hover:text-[#00C0E7]">{p.isPublished ? "Ocultar" : "Mostrar"}</button>
                    <button onClick={() => editar(p)} className="rounded px-2 py-1 text-xs font-semibold text-gray-400 hover:text-white">Editar</button>
                    <button onClick={() => eliminar(p)} className="rounded px-2 py-1 text-xs font-semibold text-[#E31E24] hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suscriptores */}
        <div className="card-dark p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Suscriptores del blog</h2>
              <p className="text-gray-500 text-xs mt-0.5">{subs.length} {subs.length === 1 ? "persona suscrita" : "personas suscritas"}</p>
            </div>
            <div className="flex gap-2">
              {subs.length > 0 && <button onClick={() => setVerSubs((v) => !v)} className="text-sm text-gray-400 hover:text-white px-3 py-1.5">{verSubs ? "Ocultar" : "Ver lista"}</button>}
              {subs.length > 0 && <button onClick={exportarCsv} className="btn-cyan text-sm px-4 py-1.5">Exportar CSV</button>}
            </div>
          </div>
          {verSubs && (
            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-gray-800 border-t border-gray-800">
              {subs.map((s) => (
                <div key={s.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-300">{s.email}</span>
                  <span className="text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString("es-PE")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
