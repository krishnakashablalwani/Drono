import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      missionName = "Operation Karakoram - Ridge Sector 4",
      targetType = "Forward Mountain Outpost",
      altitudeM = 68.5,
      gsdCm = 2.2,
      reconstructedPoints = 64200,
      activeTool = "orbit",
      measurement = null,
      losStatus = null,
      markers = [],
    } = body;

    const systemPrompt = `You are Drono AI, a specialized tactical geospatial reconnaissance and aerial mapping intelligence assistant built for the National Technical Research Organisation (NTRO).
Your mission is to analyze metrically reconstructed 3D terrain geometry, single-pass UAV flight telemetry, and tactical markers to deliver structured, high-value situation assessments (SITREPs) to operational commanders.

Always structure your response using clear markdown headings:
### 1. Situational Assessment (SITREP)
- Concise breakdown of terrain contours, elevation profile, and reconstructed structural topology.
### 2. Line-of-Sight & Vantage Analysis
- Evaluation of direct visual lines between elevated surveillance points and ground targets; detection of terrain ridge shadows or blindspots.
### 3. Ingress & Navigation Corridor
- Recommended path for ground/drone movement using natural depression contours to minimize exposure.
### 4. Metric Precision & Survivability
- Confidence rating based on sub-2.5cm Ground Sample Distance (GSD) and single-pass flight time (<45s) preventing radar/counter-UAS loitering detection.

Tone: Crisp, authoritative, highly technical, and actionable.`;

    const userPrompt = `DRONO RECONNAISSANCE TELEMETRY FEED:
- Flight Corridor: ${missionName}
- Target Classification: ${targetType}
- Single-Pass Flight Altitude: ${altitudeM}m AGL
- Ground Sample Distance (GSD): ${gsdCm} cm/pixel
- Synthesized 3D Mesh Geometry: ${reconstructedPoints.toLocaleString()} triangulated vertices
- Current Viewport Tool: ${activeTool}
${measurement ? `- 3D Distance Measurement: ${measurement.euclideanDistanceM}m Euclidean, ${measurement.groundDistanceM}m Ground, ${measurement.elevationDeltaM}m Elevation Delta (Slope: ${measurement.slopeDegrees}°)` : ""}
${losStatus ? `- Line-of-Sight Status: ${losStatus.hasLos ? "DIRECT OPTICAL VISIBILITY (EXPOSED)" : "OCCLUDED BY TERRAIN RIDGE (CONCEALED)"} (Distance: ${losStatus.distance}m)` : ""}
- Tactical Assets / Markers: ${markers.map((m: any) => `${m.name} [${m.type}] at [${m.position?.x}, ${m.position?.y}, ${m.position?.z}]`).join("; ") || "FOB Alpha, Watchtower Sector 3, Bridge 104"}

Generate the Commander's Tactical Situation Report immediately.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", errText);
      return NextResponse.json(
        { error: "Failed to communicate with Groq LPU engine", details: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Strip reasoning or thinking tags if present
    const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return NextResponse.json({
      success: true,
      model: GROQ_MODEL,
      sitrep: cleanContent,
      latencyMs: data.usage?.total_time ? Math.round(data.usage.total_time * 1000) : 110,
      tokensUsed: data.usage?.total_tokens || 0,
    });
  } catch (error: any) {
    console.error("Tactical AI Route Exception:", error);
    return NextResponse.json(
      { error: "Internal Tactical AI processing exception", message: error.message },
      { status: 500 }
    );
  }
}
