import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { buildCortexContext } from '@/lib/ai/context-engine';
import { CFO_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

// GET: Fetch the latest report
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const latestReport = await db.aiAdvisorReport.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ report: latestReport });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Generate a NEW report
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const context = await buildCortexContext(userId);

    const { object } = await generateObject({
      // @ts-ignore - Grounding is supported at runtime, types are lagging
      model: google('gemini-2.5-flash', {
          useSearchGrounding: true 
      }),
      
      system: CFO_SYSTEM_PROMPT,
      prompt: `ANALYZE THIS BUSINESS: ${JSON.stringify(context)}`,
      temperature: 0.2,
      schema: z.object({
        // ... (Keep your existing schema exactly as is) /
        executiveSummary: z.object({
            title: z.string(),
            content: z.string(),
            status: z.enum(['On Track', 'At Risk', 'Critical'])
        }),
        performance: z.object({
            analysis: z.string(),
            bottleneck: z.string(),
            focusTip: z.object({ title: z.string(), content: z.string() }),
            chartData: z.array(z.object({ name: z.string(), value: z.number() }))
        }),
        seoAnalysis: z.object({
            overview: z.string(),
            competitorComparison: z.array(z.object({ name: z.string(), score: z.number() })),
            actionableAdvice: z.string()
        }),
        reputation: z.object({
            overview: z.string(),
            platforms: z.array(z.object({ name: z.string(), status: z.string(), count: z.string() })),
            strategy: z.string()
        }),
        actionPlan: z.array(z.object({
            step: z.string(),
            title: z.string(),
            description: z.string(),
            impact: z.string()
        })),
        focusTip: z.object({
            title: z.string(),
            content: z.string(),
            steps: z.array(z.string())
        }),
        finalNote: z.string()
      }),
    });

    // Save to DB (We store the whole JSON object in the 'actionPlan' field or a new 'reportJson' field)
    // For now, we map it to the existing schema best-effort, but rely on the JSON return for UI
    await db.aiAdvisorReport.create({
      data: {
        userId,
        inputSnapshot: context as any,
        executiveSummary: object.executiveSummary.content,
        financialAnalysis: JSON.stringify(object.performance), // Storing JSON string
        operationalAdvice: JSON.stringify(object.seoAnalysis),
        marketIntel: JSON.stringify(object.reputation),
        actionPlan: object.actionPlan as any
      }
    });

    return NextResponse.json({ success: true, report: object });

  } catch (error: any) {
    console.error("AI Generation Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}