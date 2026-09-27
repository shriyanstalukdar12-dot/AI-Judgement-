const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { caseId } = await req.json();

    if (!caseId) {
      return new Response(
        JSON.stringify({ error: "Missing caseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch the case
    const caseRes = await fetch(
      `${supabaseUrl}/rest/v1/cases?id=eq.${caseId}&select=*`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const caseRows = await caseRes.json();
    if (!caseRows || caseRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const caseData = caseRows[0];

    // Skip if already judged
    if (caseData.status === "judged" && caseData.verdict) {
      return new Response(
        JSON.stringify({ message: "Already judged", verdict: caseData.verdict }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate verdict using the case data
    const verdict = generateVerdict(caseData);

    // Update the case with the verdict
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/cases?id=eq.${caseId}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          verdict: verdict.verdict,
          verdict_winner: verdict.winner,
          verdict_reasoning: verdict.reasoning,
          status: "judged",
        }),
      },
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to update case", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, verdict: verdict.verdict, winner: verdict.winner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

interface CaseData {
  id: string;
  title: string;
  category: string;
  plaintiff: string;
  defendant: string;
  plaintiff_argument: string;
  defendant_argument: string;
}

function generateVerdict(c: CaseData): {
  verdict: string;
  winner: string;
  reasoning: string;
} {
  const plaintiffArg = c.plaintiff_argument || "";
  const defendantArg = c.defendant_argument || "";

  // Heuristic-based verdict generation
  const plaintiffWords = plaintiffArg.trim().split(/\s+/).length;
  const defendantWords = defendantArg.trim().split(/\s+/).length;
  const defendantResponded =
    defendantArg.trim().length > 0 &&
    !defendantArg.toLowerCase().includes("did not respond");

  // Score factors
  let plaintiffScore = 0;
  let defendantScore = 0;

  // Argument detail factor
  if (plaintiffWords > defendantWords * 1.5) plaintiffScore += 2;
  else if (defendantWords > plaintiffWords * 1.5) defendantScore += 2;
  else {
    plaintiffScore += 1;
    defendantScore += 1;
  }

  // Defendant didn't respond — default to plaintiff
  if (!defendantResponded) {
    plaintiffScore += 3;
  }

  // Evidence markers (specific dates, amounts, witnesses)
  const evidenceMarkers = /\b(\$|USD|date|witness|saw|text|email|receipt|contract|agreed|promise|on .+ (day|morning|evening|night))\b/i;
  if (evidenceMarkers.test(plaintiffArg)) plaintiffScore += 2;
  if (evidenceMarkers.test(defendantArg)) defendantScore += 2;

  // Acknowledgment of fault
  const faultMarkers = /\b(I (was wrong|admit|apologize|should have|made a mistake|my fault))\b/i;
  if (faultMarkers.test(plaintiffArg)) defendantScore += 1;
  if (faultMarkers.test(defendantArg)) plaintiffScore += 1;

  // Extremity / reasonableness
  const extremeMarkers = /\b(always|never|everyone|nobody|worst|best|hate|stupid|idiot|crazy)\b/i;
  const plaintiffExtreme = (plaintiffArg.match(extremeMarkers) || []).length;
  const defendantExtreme = (defendantArg.match(extremeMarkers) || []).length;
  if (plaintiffExtreme > defendantExtreme) defendantScore += 1;
  if (defendantExtreme > plaintiffExtreme) plaintiffScore += 1;

  // Determine winner
  let winner: string;
  if (plaintiffScore > defendantScore + 1) winner = "plaintiff";
  else if (defendantScore > plaintiffScore + 1) winner = "defendant";
  else winner = "split";

  const winnerName =
    winner === "plaintiff"
      ? c.plaintiff
      : winner === "defendant"
      ? c.defendant
      : null;

  // Generate verdict text
  let verdictText: string;
  let reasoningText: string;

  if (winner === "split") {
    verdictText = `After careful review of the case "${c.title}", this court finds that both parties share responsibility in this matter.\n\n${c.plaintiff} presented a ${plaintiffWords > 30 ? "detailed" : "brief"} argument, while ${c.defendant} ${defendantResponded ? "provided their side of the story" : "did not respond to the allegations"}.\n\nBoth parties have merit in their positions. ${c.plaintiff} raises valid concerns, but ${c.defendant}${defendantResponded ? "'s perspective also carries weight" : "'s silence, while not an admission of guilt, does not help their case"}.\n\nThis court rules in a split decision: both parties are advised to find a middle ground. Neither side is entirely right or wrong.`;
    reasoningText = `The arguments from both sides were relatively balanced in terms of detail and evidence. ${c.plaintiff} scored ${plaintiffScore} points and ${c.defendant} scored ${defendantScore} points. When both sides present comparable arguments without clear preponderance of evidence, a split decision is the most just outcome. The court encourages mediation and compromise.`;
  } else if (winner === "plaintiff") {
    verdictText = `After careful review of the case "${c.title}", this court rules in favor of ${c.plaintiff}.\n\n${c.plaintiff} presented a compelling case with ${plaintiffWords > 50 ? "substantial detail and specificity" : "sufficient detail"}. ${defendantResponded ? `While ${c.defendant} provided a response, ` : `Notably, ${c.defendant} did not respond to the allegations, and `}${c.plaintiff}'s argument carried greater weight based on the evidence and reasoning presented.\n\nThe court finds in favor of ${c.plaintiff}. ${defendantResponded ? `${c.defendant} is advised to acknowledge the concerns raised.` : `${c.defendant} is encouraged to present their side in future proceedings.`}`;
    reasoningText = `The plaintiff scored ${plaintiffScore} points versus the defendant's ${defendantScore} points. Key factors: ${plaintiffWords > defendantWords * 1.5 ? "the plaintiff provided significantly more detail" : "the plaintiff's argument was more specific"}. ${!defendantResponded ? "The defendant's failure to respond was a significant factor. " : ""}${evidenceMarkers.test(plaintiffArg) ? "The plaintiff referenced concrete evidence. " : ""}The preponderance of evidence favors the plaintiff.`;
  } else {
    verdictText = `After careful review of the case "${c.title}", this court rules in favor of ${c.defendant}.\n\n${c.plaintiff} brought forward allegations, but ${defendantResponded ? `${c.defendant} presented a strong defense that effectively countered the claims. ` : `while ${c.defendant} did not respond, the plaintiff's argument lacked sufficient specificity to meet the burden of proof. `}The evidence and reasoning presented by ${c.defendant}${defendantResponded ? " outweighed the plaintiff's claims" : " — or lack thereof from the plaintiff — outweighed the plaintiff's claims"}.\n\nThe court finds in favor of ${c.defendant}. ${c.plaintiff} is advised to reflect on the situation and consider whether the dispute could have been avoided.`;
    reasoningText = `The defendant scored ${defendantScore} points versus the plaintiff's ${plaintiffScore} points. Key factors: ${defendantWords > plaintiffWords * 1.5 ? "the defendant provided a more detailed response" : "the defendant's argument was more compelling"}. ${faultMarkers.test(plaintiffArg) ? "The plaintiff acknowledged some fault, which weighed against their case. " : ""}${evidenceMarkers.test(defendantArg) ? "The defendant referenced concrete evidence. " : ""}The preponderance of evidence favors the defendant.`;
  }

  return { verdict: verdictText, winner, reasoning: reasoningText };
}
