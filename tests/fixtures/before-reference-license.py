def reference_license(profile_record):
    for role in read(ROOT / "For-AI/VOICE-CAST.json")["roleProfiles"]:
        reference = role.get("reference", {})
        if (role.get("voiceId") == VOICE and role.get("secretTunnelProfileId") == PROFILE
                and reference.get("workingReferenceSha256") == BINDING["originalSha256"]
                and reference.get("license")):
            return reference["license"]
    return (BINDING.get("referenceLicense") or profile_record.get("reference_license") or profile_record.get("license")
            or ("CC0-1.0 (EmoDB original, transformed reference)" if VOICE == "amt-brunhilde-knick"
                else "unknown; selected profile does not record reference license"))
