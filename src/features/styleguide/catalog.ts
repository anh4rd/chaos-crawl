/** Notes describe the existing contracts; components stay owned by their features. */
const notes: Record<string, { usage: string; dependencies: string }> = {
  SessionStatusExample: {
    usage:
      "Local participant status, private-feed, recovery and spinner reference.",
    dependencies:
      "Shared presentation components and local state only; no connection, credential or backend hooks.",
  },
  LegacyAdminExample: {
    usage:
      "Backend-free eight-panel administration reference with local pending/error, name/team/score/voting/schedule/file actions.",
    dependencies:
      "Controlled views only; intercepts navigation and never mounts connected admin controllers.",
  },
  LegacyHostExample: {
    usage:
      "Backend-free four-tab console reference with local scheduling, scores, roster and feedback.",
    dependencies:
      "Controlled console views only; never mounts LegacyHostWorkspace or reads credentials.",
  },
  RoundMovementControls: {
    usage:
      "Controlled native current/next round controls shared by legacy administration and its local reference.",
    dependencies:
      "Supplied values and callbacks; no scheduling, query or persistence lifecycle.",
  },
  CompletionReviewView: {
    usage: "Controlled legacy completion collection and review links.",
    dependencies:
      "Caller supplies presentation/counts and review callbacks; no route construction, reads or mutations.",
  },
  ParticipationView: {
    usage: "Controlled legacy host participation and challenge presentation.",
    dependencies:
      "Caller supplies selected player, completion models, upload slot and actions; no storage or query ownership.",
  },
  VotingView: {
    usage:
      "Controlled legacy voting setup and phase actions with supplied target/state/callbacks.",
    dependencies:
      "Shared primitives preserve native controls; no SDK, score decisions or phase writes.",
  },
  TeamsView: {
    usage:
      "Controlled legacy team creation and assignment fields in the local admin reference.",
    dependencies:
      "Native controls and supplied collections/callbacks; trimming, locking, persistence and feedback stay in feature controllers.",
  },
  PlayerNameForm: {
    usage:
      "Controlled native player rename form with supplied draft, pending state and callbacks.",
    dependencies:
      "FormStack native, Input and Button retain native form contracts; no persistence.",
  },
  PlayersView: {
    usage:
      "Controlled legacy player collection with supplied name-editor slots and score/delete callbacks.",
    dependencies:
      "Queries, confirmations, ledger projection and operation lifetime remain in the feature controller.",
  },
  AdminNavigation: {
    usage:
      "Controlled legacy administration panel choices with supplied active value and callbacks.",
    dependencies:
      "Native buttons with pressed state and owned admin-navigation SCSS; ordinary keyboard Tab semantics.",
  },
  LegacyAdminView: {
    usage:
      "Controlled eight-panel legacy administration frame. Local reference uses section semantics and local state.",
    dependencies:
      "PageFrame content and supplied navigation/body slots; never reads backend, credentials or route parameters.",
  },
  UploadInput: {
    usage:
      "Native file-input passthrough preserving the existing hidden chooser contract. Local legacy administration opens it through a native action.",
    dependencies:
      "Ref/accept/change props only; caller owns validation and persistence. This is not a general file-input accessibility repair.",
  },
  NativeSelect: {
    usage:
      "Native controlled select passthrough with close/regular/wide spacing appearances. Local legacy administration demonstrates native values and callbacks.",
    dependencies:
      "Caller owns options, labels, values, disabled state and validation; no queries or mutations.",
  },
  LiveIndicator: {
    usage:
      "Decorative shared live dot in the local participant status reference.",
    dependencies:
      "Owned live-indicator SCSS and existing animation tokens; no connection state ownership.",
  },
  SyncStatus: {
    usage:
      "Controlled participant sync/error/retry line with supplied timestamps and callbacks. Shared participant status and recovery uses local state.",
    dependencies:
      "Native div/Button presentation and owned sync-status SCSS; no polling, backend or credential reads.",
  },
  FeedbackNotice: {
    usage:
      "Controlled native div feedback surface with error/success tone. Supply children and explicit announcement semantics such as role=alert or role=status when appropriate. Local host workspace furniture (HostFoundationExample) toggles both tones using local state; Local host account tabs supplies local submit feedback.",
    dependencies:
      "Owned feedback-notice SCSS and native div attributes. No default ARIA role, timers, dismissal, backend calls or feedback state ownership.",
  },
  RankingRow: {
    usage: "Controlled console rank/name/score row preserving caller order.",
    dependencies:
      "Shared CountBadge and owned ranking-row SCSS; no sorting or queries.",
  },
  LiveStatus: {
    usage: "Controlled live/break status with caller-selected state and copy.",
    dependencies:
      "Owned console appearance; no timer, subscription or persistence.",
  },
  PageIntroduction: {
    usage:
      "Controlled console section introduction in the local legacy host reference.",
    dependencies:
      "Owned typography/spacing; caller owns heading, copy and coordination.",
  },
  ContentCopy: {
    usage:
      "Directory groups supplied host name and metadata in Local host workspace furniture (HostFoundationExample). Controlled console heading/copy group, including compact list copy. Local legacy host console supplies its content.",
    dependencies:
      "Owned SCSS; native children and class props only, no backend or route state.",
  },
  PlayerRecovery: {
    usage:
      "Controlled legacy missing-player recovery with a supplied join callback. Keeps the compact native page and original copy.",
    dependencies:
      "PageFrame, Button and owned player-recovery SCSS; no credential reads, navigation or queries.",
  },
  ChallengeReviewHeader: {
    usage:
      "Controlled legacy review heading accepting a challenge presentation or a supplied invalid-parameter message.",
    dependencies:
      "Card and owned review-heading SCSS; parsing, route parameters and review queries stay in its route adapter.",
  },
  BrandArtwork: {
    usage:
      "Shared native title image for legacy join and gameplay. Local legacy player screens demonstrates it through the controlled join view.",
    dependencies:
      "Existing Title.png and the application base path; owned brand-artwork SCSS. No routing or state.",
  },
  ScreenIntro: {
    usage:
      "Shared title-and-copy card for legacy leaderboard and published vote results. Local legacy player screens supplies local copy.",
    dependencies:
      "Card and owned screen-intro SCSS; retains the native heading cascade and does not select result publication.",
  },
  LegacyJoinView: {
    usage:
      "Controlled legacy join form; accepts name, busy/locked state, feedback and callbacks. Local legacy player screens uses a div frame and local state.",
    dependencies:
      "PageFrame, Card, Input, Button and shared BrandArtwork with owned join-form SCSS. No route, storage, auth or player creation.",
  },
  BallotView: {
    usage:
      "Controlled legacy player/team ballot, checking/cast/rejoin states and supplied callbacks. Local legacy player screens never mounts the connected Ballot controller.",
    dependencies:
      "PageFrame, Card, Button, ChoiceOption ballot and owned ballot SCSS with explicit presentation state. No queries, credential storage or navigation.",
  },
  VoteResultsView: {
    usage:
      "Controlled legacy published result list, preserving caller order and totals. Local legacy player screens supplies sample results.",
    dependencies:
      "PageFrame, shared ScreenIntro, Card and owned vote-results SCSS. The connected route guards voting/publication before passing results; this view never chooses publication policy.",
  },
  SubmissionCardView: {
    usage:
      "Controlled legacy submission media and award fields; receives completion, player, resolved media and award state/callbacks.",
    dependencies:
      "Card, Button and native media/form controls. SubmissionCard owns the focused award hook; this view never persists scores.",
  },
  BingoChallengeCard: {
    usage:
      "One controlled legacy side challenge and its completion/upload actions. Demonstrated inside the local SideChallenges example.",
    dependencies:
      "SideChallenge presentation and narrow participation actions. No route, storage or live hook.",
  },
  EmptySlideshow: {
    usage:
      "Controlled legacy empty-upload message with supplied reload callback. Legacy slideshow playback uses local data and a local reload action.",
    dependencies:
      "Owned empty-slideshow SCSS and Note waiting. Retains native div/h1/p/button and the existing inherited heading cascade; no queries or playback lifecycle.",
  },
  DataTable: {
    usage:
      "Native table inside its owned scroll wrapper. Supply native table props and caller-composed thead/tbody/row/cell slots; Local platform admin preserves explicit column scope and action labels.",
    dependencies:
      "Owned data-table SCSS. No column configuration, sorting, records, queries, selection or commands.",
  },
  FinalSlideshow: {
    usage:
      "Connected final-TV coordinator keyed by session ID in its route adapter. Never mount in local examples; Shared TV slideshow uses presentation components only.",
    dependencies:
      "Typed inferred view/read contracts, focused polling/selection/media/fullscreen hooks, existing sessionEvidenceUrl and shared TV views. Preserves same-session host selection and media cadence.",
  },
  SecretSlideshow: {
    usage:
      "Connected secret-review TV coordinator keyed by session ID. Missing mission retains the waiting guard; local examples never query its backend.",
    dependencies:
      "Typed inferred reads and focused external-system hooks. Identity changes discard previous evidence/feedback, while shared views receive resolved URLs and callbacks only.",
  },
  PlaybackControls: {
    usage:
      "Controlled previous/pause-or-resume/next actions with a caller-composed end slot. Legacy slideshow playback demonstrates local state only.",
    dependencies:
      "Existing Button controls and owned ControlRow playback/end variants; no global keyboard listener, timers, backend or media lifecycle.",
  },
  UnavailableUpload: {
    usage:
      "Controlled unsupported/missing upload message with a supplied skip callback. The legacy local reference never reads storage or starts playback hooks.",
    dependencies:
      "Existing Button and retained native markup; no URL resolution or persistence.",
  },
  UploadCaption: {
    usage:
      "Controlled legacy upload metadata caption with supplied pub/challenge/player/team values.",
    dependencies:
      "Presentation-only Media projection. Does not select media, query records or format a route.",
  },
  SlideshowView: {
    usage:
      "Controlled legacy fullscreen/empty presentation with supplied media slot, playback values and callbacks. The route/player retains queries, timers and native media lifecycle.",
    dependencies:
      "Shared PlaybackControls and feature UploadCaption. Local example uses div and local state, never the global-keyboard playback hook.",
  },
  SlideshowScreen: {
    usage:
      "Shared TV visual base accepting main/div, live, optional counter={index,total}, onFullscreen, error and children. Shared TV slideshow demonstrates local actions without requesting fullscreen or mounting a connected route.",
    dependencies:
      "Owned slideshow-screen BEM styling and shared CountBadge/IconButton/Note variants. Playback, empty and loading variants preserve the legacy base; caller owns every query, timer, media selection and fullscreen request.",
  },
  SlideshowMessage: {
    usage:
      "Shared waiting/empty TV body accepting caller-composed copy and children. Demonstrated in Shared TV slideshow without backend access.",
    dependencies:
      "Owned slideshow-message BEM styling. Does not choose session phase or visibility.",
  },
  SlideshowEvidence: {
    usage:
      "Native image/video evidence with resolved src, id, mediaType, alt and ended/error callbacks. Shared TV slideshow demonstrates a local image; final and secret routes retain media selection/timing.",
    dependencies:
      "Owned slideshow-evidence BEM styling; native autoplay/muted/playsInline video. Never queries storage or reads route parameters.",
  },
  SlideshowCaption: {
    usage:
      "Shared TV caption receiving kicker ReactNode and title. Shared TV slideshow demonstrates caller-selected copy.",
    dependencies:
      "Owned slideshow-caption and shared Overline slideshow styling. No data formatting, query or publishing decisions.",
  },
  PlatformGames: {
    usage:
      "Connected platform-games coordinator mounted by SuperAdmin. Owns local filters and composes separate list and inspector hooks inside HostWorkspace; never mount in local examples.",
    dependencies:
      "Typed superAdminQueries frontend-inferred contracts and existing HostPortal/HostPlanning styling. Backend authorization remains server-owned.",
  },
  PlatformGamesView: {
    usage:
      "Controlled platform list and inspector composition. Receives complete/filtered records, feedback/loading/access state and callbacks; no backend, auth or route parameters.",
    dependencies:
      "Shared heading/statistics/panels, controlled GameTable and GameInspector, and owned SCSS. Existing totals use complete records rather than filtered rows; optional onBack intercepts navigation in the local reference only.",
  },
  GameTable: {
    usage:
      "Controlled platform-game table preserving supplied order, fallback host/venue copy and inspect callbacks. Never queries or chooses authorization.",
    dependencies:
      "Frontend-inferred PlatformGame records, native DataTable slots, StatusPill table and Button table-action. Preserve incoming order, native column scope, literal status/fallback copy and supplied inspect callbacks.",
  },
  GameInspector: {
    usage:
      "Controlled native inspector dialog with supplied detail/loading, feedback and retry/close callbacks. Displays incoming sessions and player/team score copy without sorting or persistence.",
    dependencies:
      "Shared Dialog/DialogPanel inspector, IconButton panel-close, supplied feedback, ContentPanel record and ControlRow/Note metadata and score rows. Frontend-inferred PlatformGameDetail is not deployed schema. Connected lifecycle stays in useGameInspector; local examples never mount it.",
  },
  ScoreOverview: {
    usage:
      "Controlled legacy-host score composition. Admin owns ledger projection, selection, validation, commands and feedback.",
    dependencies:
      "Feature-private score presentation models; controlled adjustment, native leaderboard and display controls. No backend or route imports.",
  },
  ScoreAdjustment: {
    usage:
      "Controlled legacy player/team award or dock fields and actions; callbacks preserve caller-owned rules.",
    dependencies:
      "Native controls and legacy styling; no sign/default/trim/ID decisions or persistence.",
  },
  ScoreLeaderboard: {
    usage:
      "Caller-ordered legacy score rows retaining native div/span/strong markup.",
    dependencies:
      "Feature-private entry models; no ledger computation, sorting or queries.",
  },
  ScoreDisplayControls: {
    usage:
      "Controlled legacy leaderboard/results reset actions with supplied callbacks and busy state.",
    dependencies:
      "Existing native controls; coordinator owns commands and confirmations.",
  },
  ChallengeCatalogue: {
    usage:
      "Controlled legacy-host challenge catalogue with ordered round/side models and callbacks. Admin owns query, command, current/scheduled/past and completion-count projections.",
    dependencies:
      "Feature-private legacy-host presentation models and views with retained host-v2 classes. No backend or route imports; distinct from V2 session challenge rules.",
  },
  RoundChallengeList: {
    usage: "Controlled legacy round heading and caller-ordered challenge rows.",
    dependencies:
      "ChallengeRoundModel and feature ChallengeListItem; state flags and callbacks arrive from Admin.",
  },
  ChallengeListItem: {
    usage:
      "Legacy challenge copy/status and reveal/schedule actions with supplied flags and callbacks.",
    dependencies:
      "Feature-private model, native controls and retained host-v2 styling; no queries or scheduling decisions.",
  },
  SideChallengeList: {
    usage:
      "Controlled legacy side-challenge collection with supplied completion counts and review callbacks.",
    dependencies:
      "Feature SideChallengeItem and caller order; no completion queries or navigation construction.",
  },
  SideChallengeItem: {
    usage:
      "Legacy side-challenge copy, supplied completion count and review action.",
    dependencies:
      "Feature-private presentation model and retained native styling; no persistence or route parameters.",
  },
  PageFrame: {
    usage:
      "Suspense supplies the centered main landmark used by App while a lazy route loads; it owns no loading state, routing or backend access. Shared native main/div frame for legacy join, gameplay and leaderboard. Native attributes and caller classes pass through; Shared legacy page frame uses div to avoid a nested main and never mounts connected routes. Content supplies width/minimum-height/padding without child spacing for legacy result loading.",
    dependencies:
      "Page-frame BEM identity. Stack/compact/loading variants own legacy page width, viewport minimum, rem padding and child spacing; bare preserves unstyled local composition. No routing, data, storage or coordination.",
  },
  MetadataList: {
    usage:
      "Native metadata group. Compose MetadataItem children; callers retain label formatting and selection. See Shared idea card and Local catalogue.",
    dependencies:
      "Owned metadata-list SCSS; no routes, queries or domain calculations.",
  },
  MetadataItem: {
    usage:
      "Native span with a semantic icon and caller-composed value. Shared idea card demonstrates time and points.",
    dependencies:
      "Icon and owned metadata-item SCSS; no formatting or persistence.",
  },
  TagList: {
    usage:
      "Native wrapping tag group accepting div props. Idea adds card spacing; compose Badge tag for catalogue chips. See Shared idea card.",
    dependencies:
      "Owned tag-list SCSS; existing planning tag spans retain their default styles.",
  },
  StepOutline: {
    usage:
      "Ordered title/detail steps with a caller-supplied note. Numbering follows incoming order; Shared idea card and Local catalogue use local steps.",
    dependencies:
      "Owned step-outline SCSS. No routes, maps, storage or navigation choices.",
  },
  FeatureBanner: {
    usage:
      "Decorative section with caller-supplied eyebrow, title, copy and artwork slot. Local catalogue demonstrates it without a backend.",
    dependencies:
      "Overline banner and owned feature-banner SCSS. Does not choose routes or actions.",
  },
  StickerArt: {
    usage:
      "Decorative tilted icon/text tile. Caller supplies a semantic icon and copy; Local catalogue demonstrates desktop/mobile sizing.",
    dependencies: "Icon and owned sticker-art SCSS; native aria-hidden div.",
  },
  TabList: {
    usage:
      "Workspace retains the Host Hub tab appearance; Local host workspace furniture (HostFoundationExample) demonstrates selected-only tab stops, stable IDs and its named existing-section panel with local state. Native horizontal tab list. Compose controlled button tabs with roving tabIndex and linked TabPanel IDs. Left/Right wrap and Home/End focus and activate through supplied click callbacks; Local catalogue demonstrates keyboard operation.",
    dependencies:
      "Owned tab-list SCSS; caller owns selection and callbacks. No router, storage or queries.",
  },
  TabPanel: {
    usage:
      "Native linked tab panel with active/hidden state and a keyboard focus ring. Supply unique id, labelledBy, active and children; Local catalogue demonstrates all three panels without backend access.",
    dependencies:
      "Owned tab-panel SCSS and shared focus-ring fragment. Caller owns active selection and whether inactive children mount.",
  },
  SearchField: {
    usage:
      "Controlled search label/input with semantic icon and conditional clear action. Supply value, accessible label, placeholder and onChange; see Local catalogue.",
    dependencies:
      "Icon, IconButton search-clear and owned search-field SCSS. Clear preserves the existing native button type contract; callers own filtering.",
  },
  HistoryRow: {
    usage:
      "Native history entry with caller-supplied title, detail, optional note and status slot. Shared review and history demonstrates all publication states without a backend.",
    dependencies:
      "Owned history-row SCSS. Does not format dates, choose visibility, sort or query.",
  },
  TagPicker: {
    usage:
      "Native fieldset/legend with supplied label, hint, count and choice controls. Local catalogue demonstrates controlled contribution tags.",
    dependencies:
      "Owned tag-picker SCSS; caller retains selection limits/order and callbacks. Compose Button tag-option.",
  },
  CatalogueWorkspace: {
    usage:
      "Connected Explore coordinator mounted by HostExplore. Composes focused controllers and adapts filtered domain data into controlled presentation values/callbacks.",
    dependencies:
      "HostWorkspace, four useExplore controllers, catalogue/draft models and legacy host styling. Never mount in local examples; consumed database shapes are not deployed schema types.",
  },
  CatalogueView: {
    usage:
      "Controlled catalogue composition. Receive selected records, counts, filters, feedback, action callbacks and an optional contribution slot. Local catalogue demonstrates local navigation, saves, moderation, busy/loading/error and forms.",
    dependencies:
      "FeatureBanner/StickerArt, PageHeading results, ControlRow heading-actions, PanelGrid ideas, ContentPanel workspace-error, EmptyState workspace, Note collection-loading and controlled catalogue sections. No routes, auth, storage or persistence.",
  },
  CatalogueFilters: {
    usage:
      "Controlled native catalogue tabs, search and category buttons. Caller owns selection, category reset and filtering; counts arrive explicitly.",
    dependencies:
      "CatalogueFiltersModel, TabList/Button collection-tab/CountBadge tab, SearchField and FilterGroup/Button category with owned SCSS. Local catalogue uses state only. Selection, filtering and category reset remain caller-owned; tabs link to unique result panels.",
  },
  TaskCard: {
    usage:
      "Task idea with supplied saved/busy values, optional admin actions and main/side callbacks. The caller decides availability and resolves community records.",
    dependencies:
      "TaskCardModel, shared Card idea, Badge idea/tag, MetadataList/MetadataItem, TagList, Button/IconButton/Icon and the retained PlusMark. See Local catalogue; no SDK access or navigation.",
  },
  LocationCard: {
    usage:
      "Location idea with native practical-check disclosure and supplied save/use callbacks. Local catalogue demonstrates its controlled values.",
    dependencies:
      "LocationCardModel, shared Card idea, Badge idea/tag, MetadataList/MetadataItem, TagList, Disclosure idea and Button/IconButton/Icon; caller owns persistence and planning navigation.",
  },
  RouteCard: {
    usage:
      "Route template with caller-owned expansion and save state. Preserves existing icon-button busy and footer-action contracts; Local catalogue demonstrates both.",
    dependencies:
      "RouteCardModel, shared Card idea, Badge idea/tag, MetadataList/MetadataItem, TagList, StepOutline and Button/IconButton/Icon. No route selection, live maps or queries.",
  },
  CommunityReviewQueue: {
    usage:
      "Groups already-selected pending-review presentation rows in caller order. Local catalogue supplies a local queue; this view never chooses publishable records.",
    dependencies:
      "CommunityReviewItem, shared Icon and explicit review models/callbacks.",
  },
  CommunityReviewItem: {
    usage:
      "Controlled review row with supplied date/detail strings, busy state and approve/reject callbacks. Local catalogue exercises its actions without a backend.",
    dependencies:
      "ReviewItemModel and Button/Icon; permissions, filtering, formatting and commands stay in the coordinator.",
  },
  SubmissionHistory: {
    usage:
      "Presentation of caller-selected history rows, supplied dates/status/notes and incoming order. Local catalogue provides a sample pending record.",
    dependencies:
      "SubmissionHistoryItem presentation values only. Never selects records by user identity or queries submissions.",
  },
  ChallengeContributionDialog: {
    usage:
      "Controlled native contribution dialog with supplied editing flag, unified close callback, feedback and form slots. Local catalogue opens local content only.",
    dependencies:
      "Shared Dialog contribution, DialogPanel/PanelHeading contribution and IconButton. Native modal focus, Escape/backdrop dismissal and opener recovery; feature owns drafts, pending writes and feedback. Fields and cancellation remain available while submit disables.",
  },
  ChallengeContributionForm: {
    usage:
      "Controlled native contribution form. Supply draft, editing/busy values, draft patches, tag/submit/cancel callbacks. Retains required/length/numeric bounds and the eight-tag disabled state. Local catalogue submits local state only.",
    dependencies:
      "ContributionFormModel, static tag choices, Button/Icon and PlusMark. Only submit disables while busy; other fields/cancel remain editable. No persistence or trimming policy.",
  },
  PlusMark: {
    usage:
      "Retained decorative Explore text-plus glyph for structural parity. Feature-local compatibility only; replace during the separate semantic-icon/styling slice rather than copying it elsewhere.",
    dependencies:
      "Existing host-explore-plus styling. Used by task and contribution views in Local catalogue.",
  },
  FilterGroup: {
    usage:
      "Native div grouping explicit filter controls; caller supplies labels, roles and buttons. Local saved items demonstrates filtering without backend access.",
    dependencies:
      "Categories supplies catalogue chips with Button category; Local catalogue demonstrates native controlled selection. Owned filter-group SCSS. Pair with Button filter and CountBadge filter; no state or automatic selection.",
  },
  SavedItemsWorkspace: {
    usage:
      "Connected /host/saved coordinator. Mount through HostSaved; it composes the authenticated workspace with the saved-items controller.",
    dependencies:
      "HostWorkspace identity, useSavedItems, typed hostSavedQueries/hostSavedCommands and owned collection styling. Never mount in the local reference. Query contracts are inferred frontend consumption shapes, not verified deployed schema.",
  },
  SavedItemsView: {
    usage:
      "Controlled saved-item collection. Supply count, visible records, filter, loading/error and callbacks. Local saved items demonstrates filtering, removal and loading without a backend.",
    dependencies:
      "SavedItemCard, FilterGroup/Button filter, CountBadge filter, PanelGrid collection, ContentPanel workspace-error and EmptyState workspace. No router, storage, auth or persistence access.",
  },
  SavedItemCard: {
    usage:
      "Saved task/location/route presentation. Preserves nullish title fallback, optional description/stops, numeric points including zero and the labeled remove action.",
    dependencies:
      "Caller-supplied saved item and remove callback; shared ContentPanel entity, IconBadge entity, Overline workspace, Badge entity and Icon/IconButton with owned saved-item-card SCSS. No queries or writes.",
  },

  PlayerDemoExperience: {
    usage:
      "Public /demo/player coordinator. Owns only local state and the existing guided-tour content; it never reads a live session.",
    dependencies:
      "usePlayerDemo, PlayerDemoView, shared DemoNotice/GuidedTour/Icon and owned BEM component/route SCSS. Layout unification awaits user design input; preserve local uploads/votes and tour targets in either layout.",
  },
  PlayerDemoView: {
    usage:
      "Controlled demo presentation with explicit local values/actions and supplied tour steps. Its public route is the backend-free interactive reference.",
    dependencies:
      "No route, storage or backend access. Owned BEM SCSS and tokens preserve the legacy phone composition while the shared-layout choice is pending; do not promote duplicate live-session widgets from this view.",
  },

  AccessHeader: {
    usage:
      "Presentation header with brand and hint copy. Local join and rejoin demonstrates the entry labels.",
    dependencies:
      "Native header/span markup and owned access-header SCSS. No routes, storage or backend work.",
  },
  FormStack: {
    usage:
      "Contribution retains the native grid form in Local catalogue. Native controlled form with vertical spacing. Pass native form props and caller-composed children; demonstrated in the local join reference.",
    dependencies:
      "Owned form-stack SCSS; submission and validation belong to the caller.",
  },
  MascotArt: {
    usage:
      "Presentation-only mascot illustration. Pass native image props including descriptive alt text and the existing source asset.",
    dependencies:
      "Owned mascot-art SCSS. Local join/rejoin demonstrates the existing image without backend access.",
  },
  FloatingNotice: {
    usage:
      "Controlled floating error/notice surface. Supply message, optional icon, tone and native div attributes. The caller chooses announcement semantics; local join demonstrates existing success and toggled error states.",
    dependencies:
      "Owned floating-notice SCSS; no timers, global toast provider, persistence or backend access.",
  },

  PlayerAccess: {
    usage:
      "Connected join/rejoin coordinator. The Join route supplies normalized URL code, entry mode and the successful credential redirect callback.",
    dependencies:
      "usePlayerAccess and the typed SDK access boundary in lib/playerAccess.ts. Owns credential storage, command feedback and phase state. Pending joins are locked synchronously; unmount or target-code/mode changes invalidate their UI results without cancelling the server request. Name/mobile edits remain allowed. Never mount in a local demo. SDK error behavior is preserved rather than normalized during this extraction.",
  },
  PlayerAccessView: {
    usage:
      "Controlled join/rejoin presentation. Supply values, validation state and callbacks; as=section avoids a nested main landmark in the local reference.",
    dependencies:
      "Shared access header, heading, notices, form/panel/field/input/button primitives, GameCodeInput, PlayerDetailsFields and owned SCSS. No router, storage or backend reads/writes. Local join and rejoin demonstrates both steps and the pending contract.",
  },
  PlayerDetailsFields: {
    usage:
      "Controlled player name/mobile fields. Rejoin omits the name; preserve the mobile recovery copy, native label associations and input constraints.",
    dependencies:
      "Feature presentation values and callbacks, ContentPanel access-field, FormLabel/InputIcon access and Note access-help; owned SCSS. No persistence or credential work.",
  },
  GameCodeInput: {
    usage:
      "Controlled six-digit code input with a caller-supplied unique ID. Filters non-digits, preserves numeric/one-time-code attributes and exposes a visible label. Demonstrated in Local join and rejoin.",
    dependencies:
      "Native input and six decorative code cells with owned game-code-input SCSS. No route, storage or backend work.",
  },

  ChoiceOption: {
    usage:
      "Native choice button with supplied label, description, selected/disabled state and click callback. The local team choices reference demonstrates selected, full and busy records. Ballot variant retains the native legacy div label/optional description, selection, keyboard and disabled contracts; shown in Local legacy player screens.",
    dependencies:
      "Owned choice-option SCSS and Avatar choice variant; caller owns capacity, membership and persistence.",
  },
  TeamNameForm: {
    usage:
      "Controlled team-name input and native form shared by host and participant callers. Supply name/change/submit callbacks, placeholder, lobby/participant appearance and the submit control as children. Both local reference forms submit only local state.",
    dependencies:
      "Owned team-name-form SCSS with lobby/participant variants. Shared 40-character input limit and accessible native name; caller owns trimming, busy state, button text and commands.",
  },
  PanelGrid: {
    usage:
      "Games retains Host Hub auto-fill cards and mobile stacking; directory groups supplied HostDirectory rows. Local host workspace furniture (HostFoundationExample) exercises both with local records and empty/preview toggles. Stats preserves three columns, changing to two at 600px; Local platform admin supplies the tiles. Stack groups caller-ordered review/history rows; see Shared review and history. Ideas retains the three/two/one-column catalogue layout at 1140px/560px; Local catalogue demonstrates it. Collection supplies equal columns, stacking at 850px; see Local saved items. Two-panel layout with a wider first column, stacking at 900px. The local host frame example composes controls and context without connected controllers.",
    dependencies:
      "Native div attributes, supplied children and owned panel-grid SCSS. No queries, state or commands.",
  },
  PresentationControls: {
    usage:
      "Presentation action surface with caller-provided controls and native section attributes. Shared review and presentation controls demonstrates local connection/actions without a device picker.",
    dependencies:
      "ContentPanel session and owned presentation-controls SCSS. Connection lifecycle and commands remain in feature controllers.",
  },
  MissionAssignmentForm: {
    usage:
      "Controlled recipient/mission/time form. Supply minimal player/mission presentation models, values, busy state and callbacks. Shared mission form controls demonstrates a local submit.",
    dependencies:
      "FormLabel session and Button session-send; native form validation. Scheduling, authentication and commands remain in the controller.",
  },
  MissionCreationForm: {
    usage:
      "Controlled custom mission form inside a native disclosure. Supply values, callbacks and busy state. Local reference never creates a backend record.",
    dependencies:
      "Disclosure session, FormLabel session/checkbox and shared Button; command defaults and persistence remain in the feature controller.",
  },
  Disclosure: {
    usage:
      "Idea retains practical-check lists in Shared idea card and Local catalogue. Native details/summary composition accepting native details props and a summary slot. Session variant appears in Shared mission form controls.",
    dependencies:
      "Owned disclosure SCSS; native keyboard/open behavior, no external state or backend.",
  },
  AssignmentRow: {
    usage:
      "Assignment title, caller-provided recipient/status and decorative illustration with optional evidence children. Shared assignment rows and empty state demonstrates the row without controllers.",
    dependencies:
      "IconBadge assignment variant and owned assignment-row SCSS; no queries or domain status rules.",
  },
  AssignmentList: {
    usage:
      "Native div/grid collection for assignment rows. Accepts native props and appears in Shared assignment rows and empty state.",
    dependencies:
      "Owned assignment-list SCSS and caller-provided children; no backend access.",
  },
  EvidenceReview: {
    usage:
      "Evidence collection with an optional heading; empty collections render nothing. Items supply URL, media type, image description and metadata labels. Demonstrated in Shared submission and evidence review.",
    dependencies:
      "EvidenceReviewItem and owned evidence-review SCSS; no storage or database reads.",
  },
  EvidenceReviewItem: {
    usage:
      "Image/video review well and supplied metadata labels. Composed by EvidenceReview; images retain lazy loading and native videos retain controls, inline playback and metadata preload.",
    dependencies:
      "EvidencePresentation extended with labels and owned evidence-review-item SCSS. Captions behavior remains a tracked accessibility concern.",
  },
  SubmissionList: {
    usage:
      "Grid container accepting native div props for submission rows. Used by main/side review adapters; the local submission example demonstrates a row inside its host panel.",
    dependencies:
      "Owned submission-list SCSS and caller-provided children; no queries.",
  },
  SubmissionRow: {
    usage:
      "Submission identity, supplied formatted time and status label, with evidence/actions as children. Main and side adapters keep their own status copy and review rules; local reference exercises approve/reject without persistence.",
    dependencies:
      "Presentation values only, StatusPill review variant and owned submission-row SCSS. No domain queries or score calculations.",
  },
  SessionInvite: {
    usage:
      "Session QR, native join link, joined-player count and optional team guidance. Explicit session-secondary/session-ghost controls preserve live invitation styling. Shared session panels and invitation demonstrates local callbacks.",
    dependencies:
      "Caller-supplied URL, counts and team flags; QrFrame, shared controls and qrcode.react. No credential, clipboard or backend reads.",
  },
  QrFrame: {
    usage:
      "QR image surface accepting native div props. Host variant retains the live invitation sizing; default is used by the lobby.",
    dependencies: "SCSS .qr-frame; the caller renders its QR content.",
  },
  RoundNumber: {
    usage:
      "Current/total round display. Demonstrated in Shared session panels and invitation.",
    dependencies: "Caller-supplied numbers and SCSS .round-number.",
  },
  RoundSelector: {
    usage:
      "Detailed variant accepts descriptions/points and an interactive capability; both variants compose shared RoundChoice and preserve caller order. Round buttons from presentation models. Current and busy rounds are disabled; selection calls the supplied callback. Demonstrated locally.",
    dependencies:
      "Shared Button round-chip variants and SCSS .round-selector. No routing or writes.",
  },
  UpcomingChallenge: {
    usage:
      "Upcoming round title, description, duration, points and evidence summary with an optional action slot. Demonstrated locally.",
    dependencies: "Presentation values only and SCSS .upcoming-challenge.",
  },
  ImageWell: {
    usage:
      "Image or caller-provided fallback in badge, poster, portrait and team surfaces. Choose div/span via as; image alt defaults to empty for adjacent identity labels. Shown in Lobby surfaces and identity.",
    dependencies:
      "SCSS .image-well; caller supplies image URLs and fallback content. No storage reads.",
  },
  StepProgress: {
    usage:
      "Visual progress from supplied value/total. Keep a visible step label beside it, as in the local lobby controls example.",
    dependencies:
      "SCSS .step-progress; only the data-derived width uses inline style. No navigation or persistence.",
  },
  TeamChoiceCard: {
    usage:
      "Team membership card with supplied members, selected player and assignment callbacks.",
    dependencies:
      "Host live presentation, shared Avatar/ImageWell/Button and owned team-choice-card styles; no queries.",
  },
  TeamEditor: {
    usage:
      "Controlled team name/photo/member editing with callbacks owned by the host roster controller. The named native photo input stays keyboard-focusable with a visible label focus ring; Keyboard photo chooser demonstrates local file feedback.",
    dependencies:
      "Host live presentation and shared identity/controls; no direct storage or database access.",
  },
  CreateTeamForm: {
    usage:
      "Shared controlled team-creation form used in both team assignment and team naming steps.",
    dependencies:
      "Host live callbacks, native form submission and SCSS .team-create-form.",
  },
  HostManagement: {
    usage:
      "Presentation-only host frame, composed inside the shared SessionPage. Host patterns demonstrate local controls and a tour.",
    dependencies:
      "Owned SCSS .host-management supplies frame focus/motion rules and the inherited palette; no connected controllers or legacy host context classes.",
  },
  ControlPanel: {
    usage:
      "Titled host control surface. Pass heading, decorative marker, children and native section attributes. Host patterns include a local action and tour target.",
    dependencies:
      "ContentPanel controls variant and SCSS .control-panel; callbacks belong to its caller.",
  },
  ContentPanel: {
    usage:
      "Workspace-preview preserves the native read-only preview banner and caller-composed return action in Local host workspace furniture (HostFoundationExample). Table, notice and record retain platform data surfaces and native div/article composition in Local platform admin; they supply appearance without access policy or modal behavior. Moderation/history/moderation-item variants retain catalogue review frames in Shared review and history. Entity supports native article cards; workspace-error retains the plain div feedback surface. Both appear in Local saved items. Access variants retain native join markup in the local join/rejoin example. The overlay modifier supplies the shared centered/scrolled reward frame; compose Dialog separately for modal behavior. See Shared reward overlay frame. Section, library, selection, form, workspace, lobby, controls and session panel surfaces. Review-controls is a native div-compatible management well demonstrated locally; review-result supplies its published results surface. Session panels support stacked and compact spacing and appear in Shared session panels and invitation. Pass native props, a variant and optional as=div or as=main for its containing element; examples appear in Planning panels and fields. Choice variant supplies the participant choice surface in the local team reference.",
    dependencies:
      "SCSS .content-panel; composes caller content without backend access.",
  },
  PanelHeading: {
    usage:
      "Workspace supplies the Host Hub section heading/action arrangement in Local host workspace furniture (HostFoundationExample). Overview retains the native platform header and 600px reflow in Local platform admin. Moderation and contribution variants retain catalogue section/editor arrangement; see Shared review and history and Local catalogue. The private-mission local reference demonstrates its reveal variant. dismissible reserves room for an absolutely positioned close action, as demonstrated in Shared reward overlay frame. Title/description and action arrangement inside a panel. Accepts native div props; demonstrated with CountBadge. Session variant retains the live panel heading and mobile arrangement. Choice variant retains the participant heading layout and existing color pending the separate contrast fix; see local team references.",
    dependencies:
      "SCSS .panel-heading and the shared panel-title typography fragment.",
  },
  CountBadge: {
    usage:
      "Workspace supplies the controlled saved-plan count inside workspace tabs in Local host workspace furniture (HostFoundationExample). Moderation supplies the native review-queue counter; see Shared review and history. Tab supplies the native collection counter in Local catalogue. Filter supplies the inline collection count; see Local saved items. Round-index and round-index-current variants retain the detailed option number well; demonstrated in the shared round plan. Compact numeric/content badge accepting native span props. Shown in the planning panel example; session variant appears in Shared session panels and invitation. Choice variant supplies the participant capacity pill in the local team reference. Playback accepts native div and the legacy counter, including caller-composed Badge playback paused marker.",
    dependencies: "SCSS .count-badge; caller supplies the count.",
  },
  FormGrid: {
    usage:
      "Contribution preserves two columns until 650px in Local catalogue. Responsive two-column field arrangement accepting native div props. Shown in Planning panels and fields. Review variant retains two action columns at every viewport with zero margin and appears in Shared review and presentation controls. Dialog variant retains two numeric columns at all viewport sizes and appears in Host modal behavior.",
    dependencies:
      "SCSS .form-grid; compose shared Field controls through children.",
  },
  Explainer: {
    usage:
      "Contribution retains the private-submission notice in Local catalogue. Reward variant retains the live award instructions and caller-supplied strong/span copy. Supporting content surface with an optional pink tone. Accepts ordinary div props and children; compose Icon and paragraph content explicitly.",
    dependencies: "SCSS .explainer; both tones demonstrated locally.",
  },
  ImageUpload: {
    usage:
      "Cover image preview and native chooser. Pass label, description, imageSrc, alt and onFile. The local example reports filenames without uploading.",
    dependencies:
      "SCSS .image-upload and shared setup-upload button styling. Validation/storage belong to the caller.",
  },
  ChallengeTile: {
    usage:
      "Planning challenge presentation with supplied selection/favourite state and callbacks.",
    dependencies:
      "Core Task contract, shared Button/Icon and SCSS .challenge-tile; no queries.",
  },
  SelectedChallenge: {
    usage:
      "Selected challenge row with drag/move/remove callbacks, task-specific accessible names and disabled ordering boundaries. Pass its index and count.",
    dependencies:
      "Task and ordering supplied by the parent; SCSS .selected-challenge.",
  },
  TimelineItem: {
    usage:
      "Timeline row with named duration/move controls and reorder/delete callbacks. Keyboard movement crosses adjacent breaks, like drag/drop; ordering boundaries are disabled.",
    dependencies:
      "Schedule/task data supplied by ScheduleBuilder; SCSS .schedule-item. No persistence.",
  },
  PlanEditor: {
    usage:
      "Planning feature coordinator selected by route identity and import parameters.",
    dependencies:
      "Six focused controllers for hydration, favourites, challenge editing, scheduling, saving and cover uploads. Connected workspace; do not mount in local demos.",
  },
  GameBasicsForm: {
    usage:
      "Controlled game-basics fields and cover chooser. Supply form, update, upload callback and navigation slot.",
    dependencies:
      "Caller-owned state and shared Field/Icon; owned planning styles. No direct storage reads or writes.",
  },
  PlanSidebar: {
    usage:
      "Controlled planning stages and tabs, with supplied main/side/secret counts and navigation callbacks.",
    dependencies:
      "Planning catalog and caller state; SCSS .setup-sidebar and .setup-step. No backend.",
  },
  PlanContext: {
    usage:
      "Planning overview and completion checks, composed from the shared workspace panel primitives demonstrated in Host patterns.",
    dependencies:
      "ContextCard, Ribbon, CoverArtwork, ChecklistProgress, SetupAction and HintCard; feature rules remain caller-supplied.",
  },
  PlanNavigation: {
    usage:
      "Feature footer shared by basics and builder stages. Pass labels, saving state and back/next/save callbacks.",
    dependencies:
      "SCSS .plan-navigation; the local PlanNavigation preview uses callbacks without saving or navigation.",
  },
  VenueDetails: {
    usage: "Controlled venue name, address and notes fields.",
    dependencies:
      "Shared Field/Icon and caller-supplied update callback; no persistence.",
  },
  PlanReviewInfo: {
    usage:
      "Planning guidance directing submission moderation to the live session.",
    dependencies: "Static feature copy and shared Icon; no queries.",
  },
  IconBadge: {
    usage:
      "Entity retains the saved-item icon well, including mobile icon dimensions; see Local saved items. The private-mission local reference demonstrates its reveal variant. Stage/stage-break variants accept illustration children in a native decorative b and retain its size/type across break states. Method variant accepts text children and lime/violet/pink tones, as shown in local reward summaries. Semantic icon well with lime, violet and pink tones. Assignment variant accepts decorative illustration children and span/div markup; shown in Shared assignment rows and empty state. Used by StatTile and shown in Host patterns.",
    dependencies: "Icon and SCSS .icon-badge; no data reads.",
  },
  StatTile: {
    usage:
      "Summary preserves native article, semantic icon, strong value and span label in Local platform admin; the caller owns totals and formatting. Review variant renders label before value in a compact vote-count well; shown in Shared review and presentation controls. Compact variant shows only number/label with div/strong/span markup; default variant retains its icon tile. Number/content and label paired with IconBadge; accepts icon, tone, value and label. Host patterns demonstrate all three tones. Legacy/legacy-score variants retain native div/p statistics in the local GameStatus reference.",
    dependencies:
      "SCSS .stat-tile; surrounding stat-grid controls arrangement.",
  },
  StatusPill: {
    usage:
      "Table accepts caller-projected default/live/completed tones and literal status copy, as shown in Local platform admin. History retains pending/rejected tones and the original plain approved treatment; see Shared review and history. Reward variant accepts open/completed tones and preserves sentence case. Pill-shaped planned, draft, live or completed state. Review variant supplies submitted/approved/rejected styles and appears in Shared submission and evidence review. Pass tone and visible children; demonstrated in Host patterns.",
    dependencies: "SCSS .status-pill; caller supplies state and label.",
  },
  ContextCard: {
    usage:
      "Section surface for contextual workspace content; accepts children and an optional placement className. Shown in workspace panels.",
    dependencies:
      "SCSS .context-card. Compose Ribbon and feature content through children.",
  },
  Ribbon: {
    usage:
      "Comic panel title. Shown on the local overview and checklist panels.",
    dependencies: "SCSS .ribbon; content supplied through children.",
  },
  CoverArtwork: {
    usage:
      "Plan cover image with initial/icon fallback, or overview artwork. Accepts name, optional imageSrc, variant and fallback initial/icon class. Demonstrated in workspace panels.",
    dependencies:
      "Icon and SCSS .cover-art; images and names are caller-supplied.",
  },
  HintCard: {
    usage:
      "Compact icon and supporting copy. Pass icon and children; demonstrated below the workspace panels.",
    dependencies: "Icon and SCSS .hint-card; no backend.",
  },
  ChecklistProgress: {
    usage:
      "Shared workspace checklist and completion track. Pass checks with label, done and marker; summary and action children are slots. The local example advances by keyboard or pointer.",
    dependencies:
      "ContextCard, Ribbon and SCSS .setup-progress. Runtime width is computed only from completion data.",
  },
  SetupAction: {
    usage:
      "Full-width workspace continuation action. Accepts native button attributes; set type explicitly. Shown in the local checklist.",
    dependencies:
      "SCSS .setup-action. Callbacks and disabled state belong to the caller.",
  },
  ChallengeIcons: {
    usage:
      "Up to four challenge symbols with title tooltips; empty tasks render nothing. Shown in workspace panels.",
    dependencies: "challengeVisuals and SCSS .challenge-icons; no queries.",
  },
  HostDashboard: {
    usage:
      "Host hub selected by route view/preview ID. Overview and Your games use roving tab stops, wrapping Left/Right and Home/End, and a named games panel. Local host workspace furniture demonstrates the same keyboard contract without connected controllers.",
    dependencies:
      "useHostHub, connected HostWorkspace and feature presentation panels; do not mount in local demos.",
  },
  GameContext: {
    usage:
      "Context overview, setup progress and hint composition for a supplied plan and callbacks.",
    dependencies:
      "GameOverview, SetupProgress and shared workspace panels; no direct queries.",
  },
  GameOverview: {
    usage:
      "Overview of a supplied host game or an empty prompt, with read-only edit state.",
    dependencies:
      "ContextCard, CoverArtwork, Ribbon and caller-supplied onEdit.",
  },
  SetupProgress: {
    usage:
      "Host-game setup checks and continue/play/create dispatch for a supplied plan.",
    dependencies:
      "Shared ChecklistProgress/SetupAction; parent owns commands and navigation.",
  },
  HostDirectory: {
    usage: "Platform administrator host directory list with preview callback.",
    dependencies:
      "Caller-supplied host summaries; no authentication or data reads.",
  },
  IconButton: {
    usage:
      "Panel-close retains the native inspector close button with required accessible label and caller-owned dismissal in Local platform admin. Search-clear supplies the conditional clear action in Local catalogue, preserving its native type contract. Idea-save, idea-saved and idea-close retain catalogue native labels, titles and pending states, demonstrated in Shared idea card and Local catalogue. Entity-remove retains the saved-card border explicitly; see Local saved items. Semantic icon action with a required accessible label; optional danger, control-replay or dialog-dismiss variant. Demonstrated locally in Host patterns.",
    dependencies:
      "Button comic/control variants, Icon and SCSS .btn; native button attributes pass through.",
  },
  PageHeading: {
    usage:
      "Results renders an h2/subtitle/action frame at the original catalogue breakpoints; Local catalogue demonstrates it. Shared title, subtitle and action slot. Demonstrated in HostShell; renders nothing when all slots are empty.",
    dependencies:
      "SCSS .page-heading; content and actions belong to the caller.",
  },
  WorkspaceSidebar: {
    usage:
      "Shared workspace aside with an optional setup variant. Toggle the local sidebar in the HostShell example.",
    dependencies:
      "SCSS .workspace-sidebar; children supplied by the caller. Responsive visibility follows the host shell.",
  },
  AccountChip: {
    usage:
      "Account name with an initial avatar and optional preview marker. Pass name and preview. Demonstrated in the local HostShell preview.",
    dependencies:
      "SCSS .account-chip, Avatar and the surrounding host palette. No authentication reads.",
  },
  Avatar: {
    usage:
      "Directory supplies the HostDirectory name initial/image surface in Local host workspace furniture (HostFoundationExample); callers supply fallback names and image URLs. Name initial or optional image, with account, roster, compact and member variants. AccountChip and lobby rows share this primitive; the lobby surface example shows both image and fallback. Choice variant supplies the existing 37px initial marker in shared team choices.",
    dependencies:
      "SCSS .avatar and the host palette; no storage or user queries.",
  },
  LoadingScreen: {
    usage:
      "Centered spinner and message. Defaults to a main landmark; use as=div when embedded. Demonstrated locally in Host patterns.",
    dependencies:
      "SCSS .loading-screen and Spinner. Loading lifecycle belongs to the caller.",
  },
  Spinner: {
    usage:
      "Decorative animated loading indicator. LoadingScreen supplies its visible message; see its local example.",
    dependencies: "SCSS .spinner; no timers or data reads.",
  },
  HostHeader: {
    usage:
      "Wordmark, main host navigation, account chip and sign-out action. Pass homeHref, displayName, optional readOnlyPreview and onSignOut. Demonstrated in HostShell.",
    dependencies:
      "Router, presentation-only child components and SCSS .host-header. Sign-out uses shared IconButton. Optional onNavigate intercepts links for controlled/embedded use.",
  },
  HostNavigation: {
    usage:
      "Top-level host planning/game/explore/saved links with router active states. Demonstrated in the HostShell preview.",
    dependencies:
      "Router and SCSS .host-navigation. The link modifier follows router active state; optional onNavigate delegates clicks locally.",
  },
  HostMobileNavigation: {
    usage:
      "Responsive host home/game/explore/saved navigation. Demonstrated in HostShell at mobile sizes.",
    dependencies:
      "Router and SCSS .mobile-navigation; optional onNavigate delegates clicks locally. No backend access.",
  },
  HostWorkspace: {
    usage:
      "Connected host workspace. Accepts route content, optional sidebar/context panel and previewUser. Supplies identity, sign-out and create actions to HostShell.",
    dependencies:
      "Router and useHostIdentity/readHostIdentity/signOutHost. Live identity reads stay outside the local styleguide preview.",
  },
  InputIcon: {
    usage:
      "Access variants retain native join markup in the local join/rejoin example. Semantic icon positioned inside a composed input. Pass icon and a native or shared Input child. A local example appears in Host patterns.",
    dependencies:
      "SCSS .input-icon and Icon. Host palette variables come from the surrounding host portal.",
  },
  HostAccess: {
    usage:
      "Host login/signup route composition. The auth hook owns credentials, redirects and feedback; the form accepts presentation state and callbacks.",
    dependencies:
      "Router, hostAuth SDK commands and useHostAccess. Exercise the public host login route rather than mounting it as a local styleguide demo.",
  },
  HostAccessForm: {
    usage:
      "Controlled host login/signup form. Pass auth: HostAccessState containing values, feedback, busy state and callbacks. Linked account tabs use one keyboard stop and wrapping arrows/Home/End; the named panel retains its native form. Local host account tabs supplies state only and never authenticates.",
    dependencies:
      "Caller-supplied state; shared Field comic variant, InputIcon and Button; SCSS .host-access-form. No direct backend access.",
  },
  Overline: {
    usage:
      "Directory supplies the HostDirectory kicker in Local host workspace furniture (HostFoundationExample); workspace also supplies the local host account label. Inverse retains caller-composed platform/inspector kicker copy and optional semantic icon in Local platform admin. Moderation retains the catalogue kicker in Local catalogue and Shared review and history. Banner retains the uppercase lime label in Local catalogue. Workspace supplies the saved-item uppercase label; see Local saved items. The private-mission local reference demonstrates its reveal variant. Small uppercase-style label typography. Review variant supports native strong/span titles in Shared review and presentation controls. Accepts span/div/strong markup, primary/pink tones and an icon arrangement. Session variant appears in Shared session panels and invitation. Examples appear in the styleguide introduction, top bar and foundation panels. Choice variant supplies the participant eyebrow in the local team reference.",
    dependencies: "SCSS .overline. Text casing belongs to the caller.",
  },
  Note: {
    usage:
      "Workspace-muted and workspace-meta retain supporting copy and host-directory metadata; Local host account tabs and Local host workspace furniture (HostFoundationExample) use local data only. Inverse and record retain supplied platform copy and native session metadata spans in Local platform admin; they choose no records or statuses. Collection-loading supports a native div with catalogue loading copy, shown in Local catalogue. Access variants retain native join markup in the local join/rejoin example. Session variant provides panel copy with optional native small markup, demonstrated in Shared session panels and invitation. Control variant provides host timer messages. Lobby variant provides compact supporting copy and appears in Lobby surfaces and identity. Muted paragraph accepting shared HTML attributes. compact uses caption typography for dense descriptions; as=output supplies native status semantics, as shown in the local HostShell preview. Loading/waiting/notice/unavailable variants preserve legacy slideshow feedback in the local playback reference.",
    dependencies:
      "SCSS .note. Content and status semantics belong to the caller.",
  },
  ControlRow: {
    usage:
      "Record-header and score retain native read-only metadata/value rows in Local platform admin. Filters retains native platform filter arrangement and its 600px stacking, demonstrated by Shared filter toolbar. Moderation retains review/admin actions and their 650px grid reflow; see Shared review and history. Heading-actions supplies result-count/create arrangement in Local catalogue. Idea-actions retains the two-column catalogue action grid; see Local catalogue. Reward variant keeps right-aligned comic actions and a single-column mobile layout. Wrapping row of controls accepting native div props; timer and break variants provide compact clock/action wells. Examples appear in button and session previews. Playback/end variants own the legacy slideshow toolbar and end-action arrangement.",
    dependencies: "SCSS .control-row. Compose controls through children.",
  },
  TimerReadout: {
    usage:
      "Compact labeled timer value, composed with ControlRow timer/break variants. Caller supplies label and value; local Session timer and flow controls demonstrate it.",
    dependencies:
      "SCSS .timer-readout; no ticking, storage or publishing lifecycle.",
  },
  RoundFlowControls: {
    usage:
      "Shared round back/review/next presentation used by both host control panels. Pass round/timer/reward state and callbacks, heading and accessible label; optional children supply a status action.",
    dependencies:
      "Button flow variants and Icon. Disables actions from supplied state; never reads or writes a backend. Local timer example shows busy and reward states.",
  },
  TimerDisplay: {
    usage:
      "Prominent timer paragraph. Compose a label or ScheduledCountdown through children; see Feedback & states.",
    dependencies: "SCSS .timer-display; does not own a ticking lifecycle.",
  },
  EmptyState: {
    usage:
      "Workspace-panel accepts caller-composed native children for Host Hub loading/empty surfaces; Local host workspace furniture (HostFoundationExample) toggles its empty state locally. Workspace optionally composes an icon, title, paragraph and action, as shown by Local catalogue search emptiness; existing plain workspace children remain unchanged. Workspace accepts explicit children to preserve native loading/empty markup; see Local saved items. Centered semantic icon, message and optional action. Session variant retains the compact inline message and is demonstrated in Shared assignment rows and empty state. Search for an absent component to see the catalog example.",
    dependencies: "SCSS .empty-state and Icon; actions belong to the caller.",
  },
  Button: {
    usage:
      'Workspace-tab and workspace-link retain Host Hub tabs and quiet inline actions. Callers supply btn--workspace-selected for selection and own role, IDs, roving tabIndex and callbacks; Local host workspace furniture (HostFoundationExample) uses state only. Table-action, back-link and panel-close preserve native platform action/link/close appearance without adding business behavior; see Local platform admin. Moderation and editor variants retain comic controls; tag-option preserves controlled choices. See Shared review and history and Local catalogue. Collection-tab and category retain controlled tab/filter states in Local catalogue. Native button with poster, text, comic, setup, session, timer/flow, dialog, round/chip, review and access appearances. Idea-use/add variants retain catalogue actions; outline-toggle preserves the controlled expansion icon. Shared idea card and Local catalogue demonstrate them without a backend. Filter supplies controlled collection buttons; see Local saved items. fullWidth defaults to true. Set type="button" outside form submission; keep explicit disabled state and native attributes. Other local references demonstrate their corresponding variants.',
    dependencies:
      "Owned SCSS .btn and ordinary native button attributes. Feature controllers own actions; local examples use only supplied callbacks/state.",
  },
  Card: {
    usage:
      "Idea variant composes the shared entity surface with a required header slot and caller content. Shared idea card and Local catalogue demonstrate it without a backend. SCSS .card white rounded surface, with poster variant, accent modifier and div/section/article semantics. Compose content through children; extend with className.",
    dependencies: "None. Import from src/components/ui/Card.",
  },
  Input: {
    usage:
      "SCSS .input text, email and number fields. Accepts native input props; provide a visible label with htmlFor.",
    dependencies: "None. Import from src/components/ui/Input.",
  },
  DataError: {
    usage:
      'SCSS .data-error page error and retry. Pass error: Error and retry: () => Promise<void>. Defaults to a main landmark; use as="div" when embedded in another page.',
    dependencies: "None; retry is supplied by the caller.",
  },
  HostGuard: {
    usage:
      "Authentication route boundary. Nest protected routes inside this component; it renders an Outlet.",
    dependencies: "Router and Supabase authentication.",
  },
  HostShell: {
    usage:
      "Presentation-only host layout with title, subtitle, sidebar, contextPanel and children. Supply displayName, homeHref, onSignOut and onCreate; showCreate controls the create action. contentAs=div avoids a nested main when embedding the shell, as in the local Host patterns example.",
    dependencies:
      "Router and owned host-shell, host-header, host-navigation and mobile-navigation SCSS; shared WorkspaceSidebar, PageHeading and controls own their blocks. Optional onNavigate intercepts links for controlled previews; omitting it preserves router navigation. Authentication belongs to HostWorkspace; this component never reads Supabase.",
  },
  SessionPlayerProfile: {
    usage:
      "Player/host profile with score, rank, optional avatar and badge. See the live example above.",
    dependencies:
      "SCSS .session-profile and Router for the host link. Data is supplied by the caller.",
  },
  SessionGameTitlebar: {
    usage:
      "Game title, optional art and copyable join code. Pass name, code, onCopy and optional copied/photoUrl/tourTarget. The local chrome example demonstrates a named game-details target.",
    dependencies:
      "SCSS .session-titlebar; clipboard behavior belongs to the caller.",
  },
  Field: {
    usage:
      "The lobby variant preserves compact native select styling and is shown in the lobby surfaces example. Visible label and optional hint wrapping a native input, select or textarea. Pass label, hint and children; variant=comic preserves the host form treatment, demonstrated with InputIcon.",
    dependencies: "SCSS .field. A live example appears in UI primitives.",
  },
  Toggle: {
    usage: "Labeled native checkbox. Pass title, detail, checked and onChange.",
    dependencies: "SCSS .toggle. A live example appears in UI primitives.",
  },
  Icon: {
    usage:
      "Semantic Lucide glyph. Pass name and an icon--size-* SCSS class; mark decorative icons aria-hidden.",
    dependencies:
      "lucide-react and SCSS .icon. Examples appear in Foundations and UI primitives.",
  },
  DialogPanel: {
    usage:
      "Inspector retains the bounded native section, heading copy and record frame in Local platform admin. Contribution keeps the controlled catalogue editor frame, heading copy and 650px padding in Local catalogue; Dialog supplies modal behavior separately. The private-mission local reference demonstrates its reveal variant. Shared editor/confirmation surface. Defaults to section; as=form preserves native form props and typed submission events. Compose the heading, copy and fields through children.",
    dependencies:
      "SCSS .dialog-panel; place inside Dialog. No connected state or persistence. The host dialog reference demonstrates the form variant.",
  },
  DialogActions: {
    usage:
      "Contribution retains catalogue editor buttons and native form types in Local catalogue. Trailing dialog action row. Compose explicit Button dialog/dialog-primary variants and retain native submit/button types.",
    dependencies: "SCSS .dialog-actions; no state or command behavior.",
  },
  FormLabel: {
    usage:
      "Filter preserves native search/status wells and inherited typography; Shared filter toolbar uses local state and disabled controls. Contribution retains nested native catalogue controls, labels and focus states; see Local catalogue. Access variants retain native join markup in the local join/rejoin example. Reward and award-points variants retain native nested labels, number bounds and disabled controls; demonstrated in local Reward primitives. Review variant preserves direct label text and a native picker; shown in Shared review and presentation controls. Session and session-checkbox variants retain native nested controls and labels; Shared mission form controls demonstrates them. Composable native label preserving direct label text and control markup. spaced adds editor separation; checkbox preserves the existing checkbox layout. Native label attributes pass through, and small children retain editor hint styling; unlike Field, it adds no label span.",
    dependencies:
      "SCSS .form-label. Controls and accessible label text belong to its caller. Demonstrated with FormGrid dialog in the local host dialog.",
  },
  DialogNotice: {
    usage:
      "Warning/error copy inside a DialogPanel. Optional onDismiss supplies an alert with a labeled dismiss action; otherwise renders a paragraph. Host dialog preview demonstrates both kinds.",
    dependencies:
      "IconButton dialog-dismiss and SCSS .dialog-notice. No feedback state or persistence.",
  },
  Dialog: {
    usage:
      "Inspector retains the full native platform modal surface in Local platform admin; feature controllers own read lifetime and pending dismissal. The private-mission local reference demonstrates its reveal variant. Mount when open. Pass label, onClose, optional className and panel children. Native modal focus and Escape handling. The host variant retains the host overlay appearance; optional labelledBy and alertdialog role connect a visible title. dismissDisabled prevents Escape/backdrop dismissal during an operation and retains focus if its active control becomes disabled. describedBy links native descriptive copy; the private-mission reference demonstrates explicit acceptance with Escape/backdrop dismissal disabled.",
    dependencies:
      "Browser HTMLDialogElement and SCSS .dialog. Local demos appear in UI primitives and Host modal behavior.",
  },
  SessionMainChallengeCard: {
    usage:
      "Shared host/player challenge. Supply viewerRole, title, description, points, round, roundCount, durationMinutes, timerLabel and timerCaption. Compose buttons through action.",
    dependencies:
      "SCSS .main-challenge. No data hooks; timer text is supplied by the caller.",
  },
  SessionPage: {
    usage:
      "Shared host/player presentation. Optional contentTourTarget identifies the visible content for a caller-owned tour; the local session example includes one. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionNavigation: {
    usage:
      "Optional elementRef exposes the native nav for controller-owned focus recovery. The local session preview returns focus to Game when its temporary host action disappears. Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionNavItem: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionState: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionBreak: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionFeedback: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  StagePreview: {
    usage:
      "Shared next-stage presentation receives label, decorative illustration, title, description, highlight and optional action children. The local stage/plan example demonstrates ordinary and break states.",
    dependencies:
      "Owned stage-preview SCSS with shared Badge stage/stage-break and IconBadge stage/stage-break; no backend, storage, route or timer reads. Feature adapter owns stage precedence and copy.",
  },
  RoundPlan: {
    usage:
      "Shared round-plan heading and detailed selector. Caller provides presentation records, live/read-only capability, busy state and selection callback. Demonstrated with local read-only and selection state.",
    dependencies:
      "ContentPanel, PanelHeading, CountBadge, Overline and detailed RoundSelector. No command or query access.",
  },
  RoundChoice: {
    usage:
      "One round option with chip and detailed variants. Selected/disabled state and callback come from RoundSelector; chip examples remain in Shared session panels, detailed examples in Shared stage preview and round plan.",
    dependencies:
      "Shared Button for chips and detailed options; detailed round-choice SCSS composes CountBadge round-index/current variants while retaining native markup. No backend access.",
  },
  RoundSummary: {
    usage:
      "Shared title/detail row with caller-composed marker and status slots. The local reward primitives example shows open and completed states; copy and method rules belong to the feature.",
    dependencies:
      "Owned round-summary SCSS. No backend, storage or route access.",
  },
  CandidateList: {
    usage:
      "A shared bordered candidate group. Pass candidate children; selection and callbacks stay in the caller. Local reward primitives show selected disabled and read-only candidates. spaced groups separated choices and a caller-composed form, demonstrated in local team references.",
    dependencies:
      "Owned candidate-list SCSS; composes SessionCandidate without reading data.",
  },
  ReviewSummary: {
    usage:
      "Presentation-only review title, detail and description. See the local review body example.",
    dependencies:
      "Owned review-summary SCSS; caller supplies text and detail markup.",
  },
  VoterList: {
    usage:
      "Published voter names and choices using shared vote badges. The feature owns visibility and filtering.",
    dependencies:
      "Badge vote variant and owned voter-list SCSS; no backend access.",
  },
  SessionLeaderboard: {
    usage:
      "Compact variant preserves caller order and displays simple rank/name/score rows; see local review body example. Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionRankRow: {
    usage:
      "Compact variant uses a native span with name and score only. Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  EvidenceGallery: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionSubmission: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionChallengeCard: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionCandidate: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionVotingCard: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionFinalRound: {
    usage:
      "Results and the updated leaderboard remain hidden while votingOpen is true even if completed is stale. The local final-voting preview deliberately supplies both flags. Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionRewardRound: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  SessionReview: {
    usage:
      "Shared host/player presentation. See the interactive session example and source props; callbacks are optional where read-only viewing is supported.",
    dependencies:
      "Project SCSS; caller-supplied presentation data and actions. No backend or storage access.",
  },
  HostSession: {
    usage:
      "Keyed V2 host composition: shared session page, validated plan projections and focused management controllers. The route remounts it when session ID changes. Timer clock operations and round decisions have separate owners; participation supplies shared credential recovery.",
    dependencies:
      "Authenticated host route, feature read hooks and persistence services. Use isolated fixtures; mounting it starts reads and polling.",
  },
  HostLobby: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyInviteStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyParticipationStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyRosterStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyTeamAssignmentStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyTeamNamesStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  LobbyReadyStep: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostRewardRound: {
    usage:
      "Controlled reward stage composed from RewardSetupForm and RewardAwardControls. Receive player/team data and explicit actions; unused lookup-map props are not part of its contract.",
    dependencies:
      "Shared reward primitives and owned reward SCSS; useHostRewards owns commands, locks, credentials and feedback. Local reward examples use only state and callbacks.",
  },
  HostFinalRound: {
    usage:
      "Controlled final-round management using caller-supplied challenge, evidence and voting presentation. The controller retains publication and winner rules; this view does not require an unused top-vote-count prop.",
    dependencies:
      "Shared review controls and evidence presentation; useHostFinalRound owns persistence and participation recovery. Local review references never mount the controller.",
  },
  HostRoundControls: {
    usage:
      "Controlled timer and round actions. startGameOrToggleTimer names its toggle/start behavior; resetRoundTimer pauses at full duration while restartRoundTimer runs. The feature owns transitions, persistence and locks; local timer primitives remain backend-free.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostRoundOverview: {
    usage:
      "Controlled host round overview with supplied phase state and named actions. The existing Start Now and next-round controls provide explicit recovery; no timer, query or persistence lifecycle lives in this view.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostInvite: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostSecretMissions: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostSecretReview: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostSecretScreenControls: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostMainSubmissions: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  HostSideSubmissions: {
    usage:
      "Host feature presentation with explicit data and action props. Compose it from the host session coordinator; keep persistence in its controller.",
    dependencies:
      "Caller-supplied host models and callbacks; owned component and route SCSS. No internal backend reads or writes.",
  },
  ParticipantTeams: {
    usage:
      "Participant feature presentation reused by standalone players and inline hosts. Receive state and actions from the participant controller.",
    dependencies:
      "Caller-supplied participant models and callbacks; shared choice/form primitives and owned SCSS. No internal backend reads or writes.",
  },
  PrivateMissionDialog: {
    usage:
      "Controlled private-mission announcement. The local example requires Play, traps focus and restores its opener; it never reads storage or a backend.",
    dependencies:
      "Shared native Dialog with linked heading/description IDs and dismissal disabled. The caller owns acknowledgement, seen/dismissed stores and phase visibility. Reveal variants of DialogPanel, PanelHeading, Badge, IconBadge, Overline and Button own its appearance in SCSS; no legacy announcement classes remain.",
  },
  DemoNotice: {
    usage:
      "Shared local-demo banner with children, actionLabel and onAction. The session preview demonstrates reset behavior.",
    dependencies:
      "Project SCSS .demo-notice and semantic Icon; no backend access.",
  },
  ButtonLink: {
    usage:
      "Router link (to) or native anchor (href) using the same button variants and fullWidth contract as Button. Use a link for navigation and a button for an action.",
    dependencies:
      "React Router and project SCSS .btn. Local poster and host anchor examples above.",
  },
  Badge: {
    usage:
      "Moderation-type supplies the community item type; see Shared review and history. Tag supplies catalogue chips inside TagList idea in Shared idea card. Idea variants supply category labels in Shared idea card and Local catalogue; callers choose the tone and text. Entity supplies the saved-item points tag; see Local saved items. The private-mission local reference demonstrates its reveal variant. Stage/stage-break variants supply the preview label pill, demonstrated in the local stage/plan reference. Eyebrow, sticker, metadata, outline and subtle badge variants. Vote badges display published names and choices in the local review body example. Optional semantic icon; children supply the label and className can position the badge. Dialog variant supplies the existing editor kicker and appears in Host modal behavior. Playback supplies the local legacy paused marker.",
    dependencies:
      "Project SCSS .badge. Poster examples show invitation variants; the introduction and catalog demonstrate outline and subtle.",
  },
  BrandLink: {
    usage:
      "Brand wordmark link. Children default to CHAOS CRAWL; to defaults to the app root. compact appears in the styleguide top bar; host appears in Host patterns and the host/login headers. Host mark glyph sizing can be supplied through iconClassName; native Link props are accepted.",
    dependencies:
      "React Router and project SCSS .brand-link. Local poster and host anchor examples above.",
  },
  DisplayHeading: {
    usage:
      "Access variants retain native join markup in the local join/rejoin example. Outlined display heading. Choose h1/h2/h3 through as; hero selects the large hero treatment.",
    dependencies:
      "Project SCSS .display-heading. Local poster and host anchor examples above.",
  },
  InstructionStep: {
    usage:
      "Numbered instruction card with number, title and children. Reflows on compact viewports.",
    dependencies:
      "Project SCSS .instruction-step. Local poster and host anchor examples above.",
  },
  PosterCopy: {
    usage:
      "Paragraph using the poster body type scale; forwards native paragraph attributes.",
    dependencies:
      "Project SCSS .poster-copy. Local poster and host anchor examples above.",
  },
  InvitationHero: {
    usage:
      "Public invitation title, metadata and join action. Pass invite data and onJoin.",
    dependencies:
      "Caller-supplied invitation model and shared poster UI; no internal backend access.",
  },
  InvitationInstructions: {
    usage: "Three game instructions with an optional demo action.",
    dependencies: "Caller-supplied demoEnabled/onDemo; shared poster UI.",
  },
  InvitationTask: {
    usage: "Pre-event task with title and description.",
    dependencies:
      "Shared Card, Badge, DisplayHeading and PosterCopy; no backend access.",
  },
  InvitationPreparation: {
    usage: "Preparation list with titled entries.",
    dependencies: "Caller-supplied preparation items and shared poster UI.",
  },
  PreparationItem: {
    usage: "Preparation title and copy with a divider between items.",
    dependencies: "Project SCSS .preparation-item; no backend access.",
  },
  InvitationRules: {
    usage: "Invitation rules preserving whitespace.",
    dependencies: "Caller-supplied rules and shared poster UI.",
  },
  GuidedTour: {
    usage:
      "Pass steps with CSS target, title and body, plus onClose. Optional page/onNavigate supports multi-page tours. Uses a native modal dialog with contained focus, Escape dismissal and focus restoration. Keep each target visible; highlighting preserves its positioning.",
    dependencies:
      "Mounted DOM targets. Project SCSS .guided-tour and the shared native-dialog hook; renders a portal into document.body. Runtime measurement reads the existing geometry tokens.",
  },
  ScheduledCountdown: {
    usage:
      "Pass targetTime as an ISO date string. Updates every second; missing time renders nothing; expired time shows 00:00.",
    dependencies: "Browser timer only. Live example above.",
  },
  QueryPanel: {
    usage:
      "Wrap query content with queries: { loading, error, reload }[], loadingText and children. Keeps a previously loaded snapshot visible during refresh.",
    dependencies:
      "Caller-supplied query state; no internal backend access. Live states above.",
  },
  ChallengeActions: {
    usage:
      "Completion/upload buttons. Pass challenge: { id, title, points, type }, allowMedia and participation.",
    dependencies:
      "useChallengeParticipation contract; use a local adapter in demos. Live example above.",
  },
  LiveTask: {
    usage:
      "Legacy main challenge card. Pass challenge, game and participation; handles waiting and completed states.",
    dependencies:
      "GameState and Challenge types; caller-supplied participation. Live example above.",
  },
  SideChallenges: {
    usage:
      "Legacy Chaos Bingo list. Pass challenges and participation; completed challenges are filtered out.",
    dependencies: "SideChallenge[] and useChallengeParticipation contract.",
  },
  HostChallengeCard: {
    usage:
      "Host bingo card with completion badges and review navigation. Pass challenge, completedBy and participation.",
    dependencies: "Router, SideChallenge, Player[] and participation contract.",
  },
  Ballot: {
    usage:
      "Player/team voting workflow. Pass playerId, challenge, target, players, teams and fromAdmin.",
    dependencies:
      "Router, saved player session and useBallot backend reads/writes.",
  },
  ChallengeReviewContent: {
    usage:
      "Submission review list. Pass challengeType, challengeId and challengeTitle; handles loading, error and empty states.",
    dependencies: "usePlayers and useChallengeReview live queries.",
  },
  SubmissionCard: {
    usage:
      "Submission media and point award form. Pass completion, player, media, challengeType, challengeId and challengeTitle.",
    dependencies:
      "useSubmissionAward writes score events. Use inside an authenticated review workflow.",
  },
  MediaSlide: {
    usage:
      "Single full-screen image/video. Pass media, paused and next; handles load failure and blocked playback.",
    dependencies: "Media type and accessible media URL; sized to the viewport.",
  },
  SlideshowPlayer: {
    usage:
      "Full-screen media sequence with host playback controls. Pass media, isHost, ending, end and reload.",
    dependencies:
      "Media[], useSlideshowPlayback and caller-supplied lifecycle callbacks. Owns a main landmark.",
  },
  PlayerNameEditor: {
    usage: "Editable player name form. Pass playerId, name and async reload.",
    dependencies: "renamePlayer backend mutation; render within host controls.",
  },
  PlayersTab: {
    usage:
      "Player administration with renaming, manual score changes and deletion. No props.",
    dependencies: "Live player/score queries and backend mutations.",
  },
  TeamsTab: {
    usage: "Team creation and player assignment. No props.",
    dependencies: "Live player/team queries and useTeamManagement mutations.",
  },
  ParticipationTab: {
    usage:
      "Host participation as a selected player, including bingo completions. No props.",
    dependencies: "Live game/player/challenge/completion queries and uploads.",
  },
  CompletionReviewTab: {
    usage:
      "Read-only list of challenge completions, players, points and media indicators. No props.",
    dependencies: "Live player, challenge and completion queries.",
  },
  VotingTab: {
    usage: "Host voting controls and results. No props.",
    dependencies:
      "Router, live votes/game/player/team queries and voting mutations.",
  },
  GameControlTabs: {
    usage: "Host game controls. activeTab is live, tonight or screens.",
    dependencies:
      "useGameControls live queries and mutations; composes the control panels below.",
  },
  LiveGameSelection: {
    usage:
      "Select a pub/challenge and launch it. Pass game, pubs, sortedPubs, challenges, availableChallenges, selectedPub/selectedChallenge with setters, goLive and navigate.",
    dependencies:
      "Caller-supplied GameState and callbacks. goLive changes the current game.",
  },
  RoundChallenges: {
    usage:
      "Challenge sequence with LIVE, DONE and NEXT states. Pass game, currentRoundChallenges, currentChallengeIndex, nextRoundChallenge and revealRoundChallenge.",
    dependencies: "Caller-supplied data and reveal callback.",
  },
  ScreenControls: {
    usage:
      "Leaderboard/slideshow controls. Pass game, navigate, startSlideshow and stopSlideshow.",
    dependencies: "Caller-supplied screen lifecycle callbacks.",
  },
  TonightControls: {
    usage:
      "Round progression, timed reveals, voting and slideshow panel. See TonightControlsProps for the complete callback contract.",
    dependencies:
      "GameState, challenge/pub data, callbacks and direct voting mutations.",
  },
};

// Discover modules without importing them or starting their live data hooks.
const modules = import.meta.glob([
  "/src/components/**/*.tsx",
  "/src/features/**/*.tsx",
  "!/src/**/*.test.tsx",
  "!/src/features/styleguide/**",
]);

export const componentCatalog = Object.keys(modules)
  .sort()
  .map((path) => {
    const name = (path.split("/").at(-1) ?? path).replace(".tsx", "");
    return {
      name,
      path: path.slice(1),
      group: path.includes("/components/ui/")
        ? "Primitives"
        : path.includes("/components/")
          ? "Shared components"
          : "Features",
      ...(notes[name] ?? {
        usage: "See the source module for its props and usage.",
        dependencies: "Check the source before integrating.",
      }),
    };
  });
