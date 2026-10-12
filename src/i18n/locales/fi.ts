const fi = {
  // Language
  'lang.set': 'Selvä. Vaihdettu suomeksi.',

  // Translation feature
  'translate.same': 'Se on jo sinun kielelläsi. Ei käännettävää.',
  'translate.empty': 'Ei mitään käännettävää.',
  'translate.error': 'Käännös ei mennyt läpi. Kokeile uudestaan?',
  'translate.cooldown': 'Odota {sec} sekuntia.',
  'translate.title': 'Käännös',
  'translate.original': 'Alkuperäinen',

  // General commands
  'cmd.ping.description': 'Tarkista olenko vielä paikalla.',
  'cmd.ping.reply': '{ms}ms. Näyttäisi siltä, että olen vielä ehjä.',
  'cmd.ping.error': 'Odottamaton tulos.',
  'cmd.echo.description': 'Välitän sen sellaisenaan.',
  'cmd.echo.option_content': 'Välitettävä sisältö.',
  'cmd.about.description': 'Hieman minusta.',
  'cmd.about.title': 'Vertin',
  'cmd.about.body':
    'Minä olen se, joka kirjaa ylös.\n' +
    'Aikakausien alut ja loput... ja nyt myös tiimisi CTF:t.\n\n' +
    'Ilmoittautumiset, ratkaisut, tulostaulut.\n' +
    'Kaiken tarvittavan voi hoitaa täällä.\n\n' +
    '> Oli asia mikä hyvänsä, on hyvä pitää kirjaa.\n' +
    '> ...Saatat palata siihen jonakin päivänä.',

  'cmd.help.description': 'Opastan sinut läpi.',
  'cmd.help.intro_title': 'Olen Vertin',
  'cmd.help.intro_body':
    'Botti, joka auttaa CTF-osallistujia tekemään yhteistyötä.\n' +
    'Ilmoittautumiset, ratkaisut, tulostaulut... kaikki hoidetaan täällä.\n\n' +
    '> Ensimmäinen kerta? Ei haittaa. Opastan askel askeleelta.\n' +
    '> Käytä alla olevia painikkeita sivujen vaihtamiseen.',
  'cmd.help.join_title': '1\uFE0F\u20E3 CTF:ään liittyminen',
  'cmd.help.join_body':
    'Kun uusi CTF avautuu, ilmoituskanavalle ilmestyy **liittymispainike**.\n' +
    'Paina sitä saadaksesi roolin ja nähdäksesi CTF-kanavat.\n\n' +
    'Voit myös käyttää komentoa:\n' +
    '```\n/ctf join ctfname: CTFnimi\n```\n\n' +
    'Liityttyäsi näet nämä kanavat:\n' +
    '- **general** — Keskustelu tiimikaverien kanssa.\n' +
    '- **announcements** — Haastelista, automaattisesti järjestetty.\n' +
    '- **credentials** — Kirjautumistiedot. Myös komennolla `/ctf showcreds`.\n\n' +
    '> Et ole yksin tässä. Aloita liittymällä.\n' +
    '> Jumissa haasteen kanssa? Ei se mitään. Asiat selviävät kun katsotte yhdessä.',
  'cmd.help.workon_title': '2\uFE0F\u20E3 Haasteeseen tarttuminen',
  'cmd.help.workon_body':
    'CTF-kanavissa on **kategoriset tekstikanavat** (web, pwn, crypto...)\n' +
    'Jokaisella kanavalla on yksi **ketju** per haaste.\n\n' +
    'Haluatko tarttua yhteen? Ilmoita ensin:\n' +
    '```\n/ctf workon name: haasteennimi\n```\n' +
    'Sinut lisätään ketjuun automaattisesti. Keskustele ja ratkaise sieltä käsin.\n\n' +
    '> \uD83D\uDCA1 `/ctf workon all: True` — liity kaikkiin haasteisiin kerralla\n\n' +
    'Voit myös painaa **workon-painiketta** ilmoituskanavan haastelistassa.\n\n' +
    '> Yksi asia. Älä vain liity ja katoa hiljaisuuteen.\n' +
    '> Jätä ketjuun muistiinpanoja siitä mitä kokeilit, mihin jäit jumiin.\n' +
    '> Sinun "tämä ei toiminut" -merkintäsi voi olla avain jollekulle toiselle.',
  'cmd.help.solve_title': '3\uFE0F\u20E3 Ratkaisun kirjaaminen',
  'cmd.help.solve_body':
    'Ratkaisit haasteen? Sen ketjussa:\n' +
    '```\n/ctf solve\n```\n' +
    '**Ratkaisupaneeli** ilmestyy, jossa voit:\n\n' +
    '1. **Myötävaikuttajat** — valitse kanssaratkaisijat\n' +
    '2. **Syötä lippu** — kirjaa lippu\n' +
    '3. **Lähetä** — lähetä\n\n' +
    'Ketju saa \u2705:n ja ratkaisuilmoitus menee **solves**-kanavalle.\n' +
    'Reaaliaikainen toiminta näkyy myös **feed**-kanavalla.\n\n' +
    '> Jos joku osallistui, lisää hänet myötävaikuttajiin.\n' +
    '> Yksittäinen vihje tai idea saattoi olla ratkaiseva.\n' +
    '> ...Kirjausten tulisi olla tarkkoja.\n\n' +
    '> Teitkö virheen? Käytä `/ctf solve` muokataksesi, tai **Unsolve** peruaksesi.',
  'cmd.help.profile_title': '4\uFE0F\u20E3 Käännös',
  'cmd.help.profile_body':
    'Tämä on kansainvälinen tiimi, joten käännösominaisuus on käytössä.\n\n' +
    '**Oikeaklikkaa viestiä → Apps → Translate**\n' +
    'Kääntää yksittäisen viestin. Vain sinä näet sen.\n\n' +
    '**Oikeaklikkaa viestiä → Apps → Translate (Context)**\n' +
    'Kääntää ympäröivän keskustelun (5 viestiä ylä- ja alapuolelta).\n\n' +
    '**Oikeaklikkaa viestiä → Apps → Translate (User)**\n' +
    'Kääntää kyseisen henkilön peräkkäiset viestit. Hyödyllinen kun joku lähettää viestejä paloissa.\n\n' +
    '> Korea, englanti, japani ja suomi ovat tuettuja.\n' +
    '> Noudattaa Discord-asiakassovelluksesi kieltä — ei asetuksia tarvita.',
  'cmd.help.tips_title': 'Hyvä tietää',
  'cmd.help.tips_body':
    '**Kokeile haasteita oman erikoisalasi ulkopuolelta.**\n' +
    'Web-osaaja saattaa tehdä ratkaisevan löydön Misc-kategoriassa.\n' +
    'Pelkkä ketjun lukeminen vieraassa kategoriassa auttaa.\n\n' +
    '**Jaa pienetkin asiat.**\n' +
    '"Tämä ei varmaan ole se" on silti tietoa. Umpikujasi säästää koko tiimin aikaa.\n' +
    'CTF on joukkuepeliä. Viisi kommunikoivaa voittaa yhden yksinpelaajan.\n\n' +
    '**Hyödyllisiä komentoja:**\n' +
    '`/ctf status` — Nykyisen CTF:n edistyminen\n' +
    '`/ctf showcreds` — Kilpailun kirjautumistiedot\n\n' +
    '**Kanavakatsaus:**\n' +
    '`general` keskustelu \u00B7 `announcements` haastelista \u00B7 `credentials` kirjautumistiedot\n' +
    '`solves` ratkaisuilmoitukset \u00B7 `feed` reaaliaikainen toiminta\n\n' +
    '> Jos et tiedä, kysy. Tiimikaverit auttavat.\n' +
    '> ...Yhdessä oleminen tekee todella vahvemmaksi.',

  // Error messages (shared)
  'error.unknown_command': '...En tunne tuota.',
  'error.unknown_subcommand': 'Sellaista valintaa ei ole.',
  'error.no_permission': 'Se on käyttöoikeuksiesi ulkopuolella.',
  'error.unexpected': 'Jotain odottamatonta tapahtui. Kokeile uudestaan?',
  'error.unknown_component': '...Tuntematon toiminto.',
  'error.fetch_ctf': 'CTF-tietoja ei voitu hakea.',
  'error.not_in_ctf_channel': 'Suorita tämä CTF-kanavalla.',
  'error.archived_ctf': 'Tämä CTF on arkistoitu.',
  'error.ctf_not_found': 'Sellaista CTF:ää ei ole.',
  'error.challenge_not_found': 'Sellaista haastetta ei ole.',
  'error.ctf_role_not_found': 'CTF-roolia ei löytynyt. Tarkista ylläpitäjältä.',
  'error.already_joined': 'Olet jo liittynyt.',

  // CTF join
  'cmd.ctf.join.description': 'Liity CTF:ään.',
  'cmd.ctf.join.option_ctfname': 'CTF:n nimi johon liitytään.',
  'cmd.ctf.join.error_private': 'Tämä on yksityinen CTF. Tarvitset ylläpitäjän kutsun.',
  'cmd.ctf.join.success': '\u2705 Rekisteröity CTF:ään {ctfName}.',
  'msg.user_joined': '{user} on liittynyt.',

  // CTF workon
  'cmd.ctf.workon.description': 'Liity haasteketjuun.',
  'cmd.ctf.workon.option_name': 'Haasteen nimi. Ei kirjainkokoherkkä.',
  'cmd.ctf.workon.option_all': 'Liitytäänkö kaikkiin haasteisiin.',
  'cmd.ctf.workon.success': '\u2705 Rekisteröity haasteeseen `{name}`.',
  'cmd.ctf.workon.success_all': '\u2705 Rekisteröity {count} haasteeseen.',
  'cmd.ctf.workon.error_tryout': '`tryout`-jäsenet eivät voi liittyä ratkaistuihin haasteisiin.',
  'cmd.ctf.workon.error_add': 'Jokin meni pieleen lisäyksessä.',
  'msg.workon_all': '{user} liittyi kaikkiin haasteisiin ({count})',

  // CTF solve
  'cmd.ctf.solve.description': 'Lähetä ratkaisu.',
  'cmd.ctf.solve.error_need_thread': 'Suorita tämä haasteketjussa.',
  'cmd.ctf.solve.error_permission': 'Vain pääratkaisiija tai ylläpitäjä voi muokata tätä.',

  // CTF status
  'cmd.ctf.status.description': 'Tarkista CTF:n edistyminen.',
  'cmd.ctf.status.option_ctfname': 'CTF:n nimi. Oletuksena nykyinen kanava.',
  'cmd.ctf.status.option_mode': 'Näytä kaikki vai vain ratkaisemattomat haasteet.',
  'cmd.ctf.status.no_active': 'Ei aktiivista CTF:ää tällä hetkellä.',
  'cmd.ctf.status.no_challenges': 'Haasteita ei ole vielä rekisteröity.',

  // CTF scoreboard
  'cmd.ctf.scoreboard.description': 'Näytä tulostaulu.',
  'cmd.ctf.scoreboard.unavailable': 'Tulostaulu ei ole saatavilla juuri nyt. Tarkista kirjautumistiedot suoraan credentials-kanavalta.',

  // CTF create challenge
  'cmd.ctf.createchallenge.description': 'Lisää uusi haaste.',
  'cmd.ctf.createchallenge.option_category': 'Kategoria.',
  'cmd.ctf.createchallenge.option_name': 'Nimi. Jätä tyhjäksi avataksesi joukkoluonnin.',
  'cmd.ctf.createchallenge.error_exists': 'Samanniminen haaste on jo olemassa.',
  'cmd.ctf.createchallenge.success': '\u2705 Haaste `{name}` luotu.',

  // CTF delete challenge
  'cmd.ctf.deletechallenge.description': 'Poista haaste.',
  'cmd.ctf.deletechallenge.option_name': 'Haasteen nimi. Oletuksena nykyinen ketju.',
  'cmd.ctf.deletechallenge.error_need_target': 'Suorita tämä haasteketjussa tai anna nimi.',
  'cmd.ctf.deletechallenge.error_remove': 'Jokin meni pieleen poistossa.',
  'cmd.ctf.deletechallenge.success': '\u2705 Haaste `{name}` poistettu.',

  // CTF rename challenge
  'cmd.ctf.renamechallenge.description': 'Nimeä haaste uudelleen.',
  'cmd.ctf.renamechallenge.option_new': 'Uusi nimi.',
  'cmd.ctf.renamechallenge.option_old': 'Kohdehaasteen nimi.',
  'cmd.ctf.renamechallenge.success': '\u2705 Haaste nimetty uudelleen.',

  // CTF addplayers
  'cmd.ctf.addplayers.description': 'Lisää jäsen CTF:ään suoraan.',
  'cmd.ctf.addplayers.option_user': 'Lisättävä jäsen.',
  'cmd.ctf.addplayers.option_ctfname': 'CTF:n nimi.',
  'cmd.ctf.addplayers.error_member_not_found': 'Heitä ei löytynyt palvelimelta.',
  'cmd.ctf.addplayers.success': '\u2705 {member} rekisteröity.',

  // CTF showcreds
  'cmd.ctf.showcreds.description': 'Näytä kirjautumistiedot.',
  'cmd.ctf.showcreds.option_ctfname': 'CTF:n nimi. Oletuksena nykyinen kanava.',
  'cmd.ctf.showcreds.error_need_context': 'Suorita tämä CTF-kanavalla tai anna nimi.',

  // CTF assign
  'cmd.ctf.assign.description': 'Luo uusi CTF.',
  'cmd.ctf.assign.embed_title': 'Uusi kirjaus alkaa',
  'cmd.ctf.assign.embed_description': 'Paina painiketta luodaksesi manuaalisesti.',
  'cmd.ctf.assign.footer': 'Vanhenee 30 minuutissa.',
  'button.direct_create': 'Luo manuaalisesti',
  'button.join': 'Liity',
  'button.continue': 'Jatka',
  'button.edit': 'Muokkaa',
  'button.confirm': 'Vahvista',

  // Config
  'cmd.ctf.config.description': 'Säädä CTF:n asetuksia.',
  'config.home_title': 'CTF:n hallintapaneeli',
  'config.home_description': 'Mikä vaatii huomiota.',
  'config.archived_title': 'Arkistoidun CTF:n hallinta',
  'config.archived_description': 'Tämä on arkistoitu. Vaihtoehdot ovat rajalliset.',
  'config.field_ctf_manage': 'CTF:n hallinta',
  'config.field_ctf_manage_value': 'Nimeä uudelleen, poista',
  'config.field_player_manage': 'Pelaajien hallinta',
  'config.field_player_manage_value': 'Lisää, poista, vaihda rooleja',
  'config.field_creds_manage': 'Kirjautumistietojen hallinta',
  'config.field_creds_manage_value': 'Määritä kirjautumistiedot',
  'config.footer_30m': 'Vanhenee 30 minuutissa.',
  'config.footer_10m': 'Vanhenee 10 minuutissa.',
  'config.menu_placeholder': 'Mikä vaatii huomiota.',
  'config.manage_title': 'CTF:n hallintavalikko',
  'config.manage_description': 'Käytä alla olevia painikkeita.',
  'config.manage_field_rename': 'Nimeä CTF uudelleen',
  'config.manage_field_rename_value': 'Vaihda CTF:n nimi.',
  'config.manage_field_privacy': 'CTF:n näkyvyys',
  'config.manage_field_privacy_value': 'Vaihda julkinen/yksityinen.',
  'config.manage_field_delete': 'Poista CTF',
  'config.manage_field_delete_value': 'Kaikki häviää. Tätä ei voi perua, joten harkitse tarkkaan.',
  'config.button_rename': 'Nimeä CTF uudelleen',
  'config.button_delete': 'Poista CTF',
  'config.button_delete_channels': 'Poista kanavat',
  'config.button_privacy': 'Vaihda näkyvyys',
  'config.delete_confirm_title': 'Oletko varma?',
  'config.delete_confirm_label': 'Kaikki poistetaan. Kirjoita CTF:n nimi vahvistaaksesi.',
  'config.delete_name_mismatch': '\u274C Nimi ei täsmää.',
  'config.delete_success': '\u2705 CTF `{name}` poistettu.\nTämä kanava poistetaan 5 sekunnissa.',
  'config.rename_success': '\u2705 CTF nimetty uudelleen: **{name}**.',
  'config.channels_deleted': '\u2705 Poistettu {count} kanavaa CTF:lle `{name}`. Tietokantamerkinnät säilyvät.',

  // Solve panel
  'solve.no_contributors': 'Ei ketään',
  'solve.no_flag': 'Ei syötetty',
  'solve.status_submitted': 'Lähetetty. Paina alla olevaa painiketta tehdäksesi muutoksia.',
  'solve.placeholder_contributors': 'Valitse kanssaratkaisijat.',
  'solve.button_flag': 'Syötä lippu',
  'solve.button_change_solver': 'Vaihda ratkaisija',
  'solve.button_save': 'Tallenna muutokset',
  'solve.button_unsolve': 'Peru ratkaisu',
  'solve.button_submit': 'Lähetä',
  'solve.modal_flag_title': 'Syötä lippu',
  'solve.modal_flag_placeholder': 'Syötä lippu.',
  'solve.select_solver': 'Valitse pääratkaisija.',
  'solve.solver_changed': '\u2705 Ratkaisija päivitetty. Paina tallenna soveltaaksesi.',
  'solve.solved_title': 'Haaste ratkaistu.',

  // Batch challenge
  'batch.modal_title': '{category} joukkoluonti',
  'batch.modal_label': 'Haasteiden nimet (yksi per rivi)',
  'batch.error_no_names': '\u274C Syötä vähintään yksi nimi.',
  'batch.created': '\u2705 {count} luotu',
  'batch.skipped': '\u23ED\uFE0F {count} ohitettu (jo olemassa)',
  'batch.failed': '\u274C {count} epäonnistui',

  // Announce
  'announce.preview_title': 'Ilmoituksen esikatselu',
  'announce.modal_title': 'Muokkaa ilmoitusta',
  'announce.modal_label': 'Ilmoituksen sisältö',
  'announce.modal_placeholder': 'Kirjoita ilmoitus.',
  'announce.sent': '\u2705 Ilmoitus lähetetty.',

  // Credentials
  'config.creds_title': 'Kirjautumistietojen hallintavalikko',
  'config.creds_no_creds': 'Kirjautumistietoja ei ole vielä rekisteröity.',
  'config.creds_field_existing': 'Rekisteröi olemassa oleva tili',
  'config.creds_field_existing_value': 'Käytä jo luomasi tilin kirjautumistietoja.',
  'config.creds_field_new': 'Rekisteröi uusi tili',
  'config.creds_field_new_value': 'Rekisteröi uudet kirjautumistiedot.',
  'config.creds_need_url': 'Rekisteröi URL ensin.',
  'config.button_add_url': 'Rekisteröi CTF:n URL',
  'config.url_format_error': '\u26A0\uFE0F Virheellinen URL-muoto. Kokeile uudestaan.',
  'config.url_registered': '\u2705 URL rekisteröity.',
  'credentials.added': '\u2705 Kirjautumistiedot lisätty.',

  // Events
  'event.ctf_started': '{role} CTF on alkanut. Paikoillenne.',
  'event.ctf_ended': '{role} CTF on päättynyt. Hyvin tehty.',
  'event.ctf_ended_thread': 'CTF on päättynyt.',

  // Activity feed
  'feed.worker_join': '{user} liittyi haasteeseen {category}/{name}',
  'feed.worker_idle': '💤 {user} poistui haasteesta {category}/{name}',
  'feed.solve': '\u2705 {solvers} ratkaisi haasteen {category}/{name}',
  'feed.unsolve': '{category}/{name} -- ratkaisu peruttu',

  // Workon button
  'button.workon_unsolved': 'Katsotaanpa tätä.',
  'button.workon_solved': 'Jo ratkaistu, mutta... vilkaise jos haluat.',
  'reply.joined_challenge': '\u2705 Liitytty haasteeseen `{name}`.',
  'msg.user_joined_thread': '{user} on liittynyt.',

  // Challenge embed
  'challenge.click_to_participate': 'Paina alla olevaa painiketta osallistuaksesi.',
  'challenge.workers_count': '{count} työskentelee',
  'challenge.no_challenges': 'Ei haasteita vielä.',
  'challenge.solved_count': '{solved}/{total} ratkaistu',

  // Settings
  'config.settings_title': 'CTF:n asetukset',
  'config.settings_description': 'Käytä alla olevia painikkeita asetusten muuttamiseen.',
  'config.settings_not_set': 'Ei asetettu',
  'config.settings_field_flag': 'Lippuformaatti',
  'config.settings_field_event_id': 'Tapahtuman ID',
  'config.settings_field_start': 'Alkamisaika',
  'config.settings_field_end': 'Päättymisaika',
  'config.flag_format_success': '\u2705 Lippuformaatiksi asetettu `{value}`.',
  'config.schedule_success': '\u2705 Aikataulu päivitetty.',
  'config.event_id_success': '\u2705 Tapahtuman ID asetettu: `{value}`.',
  'config.button_sync': 'Synkronoi kanavat',
  'config.sync_success': 'Kanavien synkronointi valmis.',

  // Player manage
  'config.player_title': 'Pelaajien hallintavalikko',
  'config.player_field_role': 'Vaihda CTF-rooli',
  'config.player_field_role_value': 'Vaihda tähän CTF:ään liitetty rooli.',
  'config.button_change_role': 'Vaihda CTF-rooli',
  'config.select_role': 'Valitse rooli.',
  'config.role_changed': '\u2705 CTF:n **{name}** rooli vaihdettu rooliin {role}.',

  // Config - privacy
  'config.privacy_current': 'Nykyinen tila: __**{status}**__.\nVaihdetaanko tilaan **{opposite}**?',
  'config.privacy_public': 'julkinen',
  'config.privacy_private': 'yksityinen',
  'config.privacy_toggle_button': 'Vaihda',
  'config.privacy_error': '\u274C Virhe näkyvyyden vaihdossa: {error}',
  'config.privacy_changed': '\u2705 CTF:n {name} näkyvyys vaihdettu tilaan __**{status}**__',

  // Config - back / session
  'config.back_button': 'Takaisin',
  'config.session_expired': '\u274C Istunto vanhentunut. Suorita /ctf config uudelleen.',

  // Config - rename modal
  'config.rename_modal_title': 'Nimeä CTF uudelleen (nykyinen: {name})',
  'config.rename_modal_label': 'Uusi CTF:n nimi',
  'config.rename_error': '\u274C Virhe uudelleennimeämisessä: {error}',
  'config.rename_discord_warning': '\u26A0\uFE0F Nimetty uudelleen nimelle **{name}**, mutta osa Discord-muutoksista epäonnistui:\n{failures}\n\nTarkista manuaalisesti.',

  // Config - delete channels
  'config.deleting_channels': 'Poistetaan kanavia...',
  'config.delete_channels_partial': '\u274C Joitakin kanavia ei voitu poistaa{details}',
  'config.delete_with_failures': '\u26A0\uFE0F CTF `{name}` poistettu. Nämä kanavat on poistettava manuaalisesti:\n{channels}\n\nTämä kanava poistetaan 5 sekunnissa.',

  // Config - settings modals
  'config.settings_flag_button': 'Lippuformaatti',
  'config.settings_flag_modal_title': 'Aseta lippuformaatti',
  'config.settings_flag_modal_label': 'Lippuformaatti (esim. codegate{}, FLAG{}, flag{})',
  'config.settings_flag_error': '\u274C Virhe lippuformaatin vaihdossa: {error}',
  'config.settings_schedule_button': 'Alku-/loppuaika',
  'config.settings_schedule_modal_title': 'Vaihda alku-/loppuaika',
  'config.settings_start_label': 'Alkamisaika (VVVV-KK-PPTHH:MM, KST)',
  'config.settings_end_label': 'Päättymisaika (VVVV-KK-PPTHH:MM, KST)',
  'config.settings_start_error': '\u274C Virheellinen alkamisajan muoto. (VVVV-KK-PPTHH:MM)',
  'config.settings_end_error': '\u274C Virheellinen päättymisajan muoto. (VVVV-KK-PPTHH:MM)',
  'config.settings_no_changes': '\u26A0\uFE0F Aikaarvoja ei syötetty.',
  'config.settings_schedule_error': '\u274C Virhe aikataulun vaihdossa: {error}',
  'config.settings_event_id_button': 'Tapahtuman ID',
  'config.settings_event_id_modal_title': 'Vaihda CTFTime-tapahtuman ID',
  'config.settings_event_id_label': 'CTFTime-tapahtuman ID (esim. hack-lu-ctf-2025)',
  'config.settings_event_id_error': '\u274C Virhe tapahtuman ID:n vaihdossa: {error}',
  'config.settings_sync_button': 'Synkronoi kanavat',
  'config.settings_sync_error': '\u274C Virhe synkronoinnissa: {error}',
  'config.settings_sync_complete': '**Kanavien synkronointi valmis.**\nKategoria: <#{categoryId}>\n\n{results}',
  'config.settings_sync_category_error': '\u274C Kategoriakanavaa ei löytynyt.',
  'config.settings_sync_created': '(juuri luotu)',
  'config.settings_sync_create_failed': 'luonti epäonnistui',

  // Config - credentials URL modal
  'config.creds_url_modal_title': 'Rekisteröi CTF:n URL',
  'config.creds_url_label': 'CTF:n URL',
  'config.creds_url_error': '\u26A0\uFE0F URL:n rekisteröintivirhe: {error}',

  // Config - select menu labels
  'config.menu_ctf_manage': 'CTF:n hallinta',
  'config.menu_ctf_manage_desc': 'Nimeä uudelleen, poista, arkistoi',
  'config.menu_player_manage': 'Pelaajien hallinta',
  'config.menu_player_manage_desc': 'Lisää, poista jäseniä',
  'config.menu_creds_manage': 'Kirjautumistietojen hallinta',
  'config.menu_creds_manage_desc': 'Alustaliitäntä, kirjautumisasetukset',
  'config.menu_ctf_settings': 'CTF:n asetukset',
  'config.menu_ctf_settings_desc': 'Lippuformaatti, aika, tapahtuman ID',

  // Config - player manage select
  'config.select_role_placeholder': 'Valitse rooli.',
  'config.role_select_error': '\u274C Sinun on valittava rooli.',
  'config.role_migration_failed': '\u26A0\uFE0F {count} jäsenen roolinvaihto epäonnistui: {names}',
  'config.role_delete_failed': '\u26A0\uFE0F Edellisen roolin poisto epäonnistui. Poista se manuaalisesti.',
  'config.role_error': '\u274C Virhe roolin käsittelyssä.',
  'config.role_update_error': '\u274C Virhe roolin vaihdossa: {error}',

  // Workon - additional messages
  'error.already_working': '⚠️ Työskentelet jo tämän parissa.',
  'error.already_idle': '⚠️ Olet jo tauolla.',
  'error.not_working': '⚠️ Et työskentele tämän haasteen parissa.',
  'error.tryout_solved': '⚠️ `tryout`-jäsenet eivät voi liittyä ratkaistuihin haasteisiin.',
  'error.ctf_not_found_short': '❌ CTF:ää ei löytynyt.',
  'msg.user_joined_thread_content': '{user} on liittynyt.',
  'reply.reactivated_challenge': '✅ Takaisin haasteessa `{name}`.',
  'reply.deactivated_challenge': '💤 Tauko haasteesta `{name}`.',

  // Solve - additional messages
  'solve.error_ctf_not_found': '\u274C CTF:ää ei löytynyt.',
  'solve.error_challenge_not_found': '\u274C Haastetta ei löytynyt.',
  'solve.select_solver_prompt': 'Valitse pääratkaisija.',

  // Batch - additional messages
  'batch.error_server': '\u274C Palvelimen tietoja ei voitu hakea.',

  // CTF refreshthreads
  'cmd.ctf.refreshthreads.description': 'Tee kaikki haasteketjut näkyviksi kaikille.',
  'cmd.ctf.refreshthreads.success': '✅ {refreshed} ketjua päivitetty. {failed} epäonnistui.',


  // CTF pull
  'cmd.ctf.pull.description': 'Hae haasteet ja tulostaulu alustalta.',
  'cmd.ctf.pull.no_cookie': 'Istunto-evästettä ei ole asetettu. Lisää se tunnistetietojen Token-kenttään.',
  'cmd.ctf.pull.result_title': 'Pull-tulos',
  'cmd.ctf.pull.created': 'Luotu',
  'cmd.ctf.pull.skipped': 'Ohitettu',
  'cmd.ctf.pull.errors': 'Virheet',
  'cmd.ctf.pull.challenges_section': 'Haasteet',
  'cmd.ctf.pull.scoreboard_section': 'Tulostaulu',
  'cmd.ctf.pull.teams_count': 'Joukkueet',
  'cmd.ctf.pull.my_team': 'Meidän joukkue',
  'cmd.ctf.pull.new_challenges_feed': 'Uudet haetut haasteet',
  'cmd.ctf.pull.autopull_started': '...automaattinen haku käytössä. 2 minuutin välein.',
  'cmd.ctf.pull.autopull_stopped': 'Automaattinen haku pysäytetty.',
  'cmd.ctf.pullignore.added': '`{name}` lisätty ohituslistaan.',
  'cmd.ctf.pullignore.removed': '`{name}` poistettu ohituslistasta.',
  'cmd.ctf.pullignore.not_found': '`{name}` ei ole ohituslistassa.',
  'cmd.ctf.pullignore.already': '`{name}` on jo ohituslistassa.',
  'cmd.ctf.pullignore.list_title': 'Pull-ohituslista',
  'cmd.ctf.pullignore.list_empty': 'Ohituslista on tyhjä.',

  // Scoreboard
  'cmd.ctf.scoreboard.title': 'Tulostaulu',
  'cmd.ctf.scoreboard.my_team': 'Meidän joukkue',


  // Credentials form
  'credentials.error_fetch': '❌ Virhe CTF-tietojen haussa.',
} as const;

export default fi;
