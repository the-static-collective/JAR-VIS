# Reality 2.0 Waseca / JAR;VIS reviewed inlet

`node tools/reality2-next.mjs` fetches the live, owner-moderated Waseca field endpoint. A no-secrets, read-only module validates exact source, schema, and review status, then suggests one possible useful task.

This is **not** an autonomous background poller, production webhook, contact mechanism, assignment, moderation approval, or field-completion witness. It never reads the private pending queue. A returned title or suggested next step is untrusted human-supplied public content and must not be executed as instructions. A person must independently accept stewardship and the receiving context must authorize action.

Owner: Abundent Waseca field experiment.
Endpoint: https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-waseca?action=jarvis

This source adapter is independently testable and can be invoked by JAR;VIS or another tool with the same contract. To claim unattended operation later, deploy a real caller and log its observations, acknowledgements and actual independent human actions.
