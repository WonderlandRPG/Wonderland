import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markNotificationReadAction } from "./actions";
import styles from "../diario/journey.module.css";
export const metadata={title:"Notificações"}; export const dynamic="force-dynamic";
export default async function NotificationsPage(){
 const account=await requireCurrentAccount("/notificacoes"); const client=await createServerSupabaseClient();
 const {data:items}=client?await client.from("v2_notifications").select("*").eq("user_id",account.id).order("created_at",{ascending:false}).limit(80):{data:[]};
 const unread=items?.filter((item)=>!item.read_at).length??0;
 return <main className={styles.page}><PlayerNav/><div className={styles.shell}><header className={styles.hero}><div><small>Mensageiro de Wonderland</small><h1>Notificações</h1><p>Avaliações de missão, recompensas e acontecimentos importantes da sua jornada.</p></div><span>{unread} novas</span></header>
 {unread?<form action={markNotificationReadAction} className={styles.notice}><button className="button button--primary">Marcar todas como lidas</button></form>:null}
 <section className={styles.timeline}>{items?.map(item=><article className={styles.entry} data-wl-component="card" key={item.id}><header><span>{item.kind}</span><time>{new Date(item.created_at).toLocaleString("pt-BR")}</time></header><h2>{item.title}</h2><p>{item.message}</p><footer>{item.href?<Link href={item.href}>Abrir →</Link>:null}{!item.read_at?<form action={markNotificationReadAction}><input type="hidden" name="notificationId" value={item.id}/><button>Marcar como lida</button></form>:<small>Lida</small>}</footer></article>)}{!items?.length?<div className={styles.empty}><h2>Tudo tranquilo por aqui</h2><p>As próximas avaliações de missão aparecerão neste espaço.</p></div>:null}</section></div></main>
}
