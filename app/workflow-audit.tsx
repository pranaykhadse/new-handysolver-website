'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Gauge, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import './workflow-audit.css';

const questions = [
  { name: 'Visibility', title: 'Where’s that update?', hint: 'When you need to know where a piece of work stands…',
    options: ['I chase people across calls and chats.', 'We have a tracker, but it’s often out of date.', 'Most updates are visible, with a little checking.', 'One reliable view shows status and ownership.'],
    friction: 'Updates depend on someone stopping work to explain the work.', action: 'Pick one live workflow. Give every task an owner, a status and a next step in one shared view.', outcome: 'Your team can check progress without another round of “any update?”', prompt: 'Could someone see what’s stuck without asking you?', offer: 'A shared workflow dashboard' },
  { name: 'Connected tools', title: 'How often does the same detail travel?', hint: 'Think customer details, orders, invoices or employee records.',
    options: ['We retype the same details in several places.', 'Manual copy-paste is a regular part of the job.', 'Most tools connect, but a few gaps remain.', 'Details flow between tools with checks in place.'],
    friction: 'Every extra copy is another place for information to drift.', action: 'Trace one record through your tools. Choose a source of truth and remove one duplicate entry step.', outcome: 'Fewer mismatched records and less checking which version is right.', prompt: 'Where does your team enter the same information twice?', offer: 'System integrations and a shared source of truth' },
  { name: 'Routine work', title: 'Same task. Again tomorrow?', hint: 'Reminders, recurring reports, data entry and follow-ups.',
    options: ['People handle almost every repeat task manually.', 'A few shortcuts help, but repetition fills the day.', 'Most repeats are automated; exceptions need work.', 'Routine tasks run reliably, with exception alerts.'],
    friction: 'The repeat work competes with the work that needs a person.', action: 'Choose one frequent, rule-based task. Document its trigger, steps and exceptions before automating it.', outcome: 'People handle the exceptions instead of repeating the whole routine.', prompt: 'Which task would nobody miss doing manually next week?', offer: 'Practical automation, with AI only where useful' },
  { name: 'Handoffs', title: 'What happens when work changes hands?', hint: 'From sales to delivery, a request to approval, or one team to another.',
    options: ['Work stalls unless someone chases it.', 'We pass it on in chat and hope it gets picked up.', 'Owners are clear, but delays can go unnoticed.', 'Owners, next steps and overdue work are visible.'],
    friction: 'A handoff without a clear next owner can become a waiting room.', action: 'Define who receives one common handoff, what “ready” means and when a delayed task gets flagged.', outcome: 'Fewer dropped tasks and clearer responsibility when work slows down.', prompt: 'Which approval keeps work waiting longest?', offer: 'Connected approvals and workflow design' },
  { name: 'Team fit', title: 'Do your tools work the way your people do?', hint: 'Think about the everyday experience, not the feature list.',
    options: ['We work around the tools with chats and sheets.', 'People skip parts of the system because it’s awkward.', 'The tools mostly fit, with a few frustrating steps.', 'The team uses the tools confidently and consistently.'],
    friction: 'A system nobody wants to use creates a second, unofficial system.', action: 'Watch a teammate complete a real task. Ask which step they would remove and test a simpler version.', outcome: 'Less switching between workarounds and tools people can rely on.', prompt: 'What does your team still keep in a separate spreadsheet, and why?', offer: 'Software shaped around your people' },
];
const scoreOf = (answers: number[]) => Math.round(answers.reduce((sum, value) => sum + value, 0) / 15 * 100);

export default function WorkflowAudit() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [scenario, setScenario] = useState(false);
  const [compact, setCompact] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setCompact(window.scrollY > 720);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    scrollArea.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [step, open]);
  const complete = step === questions.length;
  const question = questions[step];
  const score = complete ? scoreOf(answers) : 0;
  const gaps = questions.map((q, index) => ({ ...q, index, value: answers[index] })).filter(q => q.value < 3).sort((a, b) => a.value - b.value);
  const priority = gaps[0];
  const potential = complete && priority ? scoreOf(answers.map((value, index) => index === priority.index ? 3 : value)) : score;
  const badge = score < 40 ? 'Too much depends on people chasing.' : score < 70 ? 'Good foundations. A few tangles.' : score < 100 ? 'Working well. Room to smooth things out.' : 'A well-connected workflow, by your answers.';
  const restart = () => { setAnswers(Array(5).fill(-1)); setScenario(false); setStep(0); };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="wa-launch" data-compact={compact} aria-label={compact ? 'Open the workflow check' : undefined}><span className="wa-launch-icon"><Gauge size={22} aria-hidden="true"/></span><span className="wa-launch-copy">How tangled is your work?<small>Take the 2-minute workflow check</small></span><ArrowUpRight className="wa-launch-arrow" size={18}/></Button></DialogTrigger>
    <DialogContent className="wa-dialog" onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus(); }}>
      <div className="wa-scroll" ref={scrollArea}>
        <div className="wa-eyebrow"><Gauge size={18} aria-hidden="true"/> THE HANDY WORKFLOW CHECK</div>
        <DialogTitle ref={heading} tabIndex={-1} className="wa-title">{step < 0 ? <>Less guesswork.<br/><em>Find your first untangle.</em></> : complete ? <>Your workday,<br/><em>a little clearer.</em></> : question.title}</DialogTitle>
        <DialogDescription className="wa-description">{step < 0 ? 'Five everyday situations. One snapshot of how your work flows. No email gate, no perfect answers needed.' : complete ? 'A starting point for a better conversation, not a verdict on your business.' : question.hint}</DialogDescription>

        {step < 0 ? <div className="wa-intro">
          <div className="wa-ticket"><span>YOUR TAKEAWAYS</span><p>A workflow score.<br/>Your biggest friction points.<br/><em>One useful place to start.</em></p><span className="wa-stamp" aria-hidden="true">LET’S<br/>UNTANGLE</span></div>
          <p>Answer for one team or workflow you know well. Choose what happens on a normal day, not your best day.</p>
          <Button className="wa-primary" onClick={() => setStep(0)}>Let’s find the tangles <ArrowRight size={18}/></Button>
          <small>Answers stay in this page’s memory only. Refreshing clears them. This self-check doesn’t send or store your answers.</small>
        </div> : !complete ? <div className="wa-question" key={step}>
          <div className="wa-progress-label"><span>QUESTION {step + 1} OF 5</span><span>{question.name}</span></div>
          <Progress className="wa-progress" value={step / 5 * 100} aria-label={`${step} of 5 questions completed`}/>
          <RadioGroup className="wa-options" value={answers[step] < 0 ? '' : String(answers[step])} onValueChange={value => setAnswers(previous => previous.map((answer, index) => index === step ? Number(value) : answer))} aria-label={question.title}>
            {question.options.map((option, index) => <label className="wa-option" data-selected={answers[step] === index} key={option} htmlFor={`wa-${step}-${index}`}><RadioGroupItem id={`wa-${step}-${index}`} value={String(index)}/><span>{option}</span>{answers[step] === index && <Check size={18} aria-hidden="true"/>}</label>)}
          </RadioGroup>
          <div className="wa-controls"><Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button><Button className="wa-primary" disabled={answers[step] < 0} onClick={() => setStep(step + 1)}>{step === 4 ? 'See my workflow score' : 'Next question'}<ArrowRight size={17}/></Button></div>
          <p className="wa-footnote">No right answer. Just your real workday.</p>
        </div> : <div className="wa-results">
          <div className="wa-score-card"><div className="wa-score"><strong>{score}</strong><span>/ 100</span></div><div><small>YOUR WORKFLOW SCORE</small><h3>{badge}</h3><p>Higher means less friction in the five areas you rated.</p></div></div>
          <div className="wa-breakdown" aria-label="Your scores by area">{questions.map((q, index) => <div key={q.name}><span>{q.name}</span><div className="wa-dots" aria-label={`${answers[index]} out of 3`}>{[1,2,3].map(n => <i key={n} data-filled={answers[index] >= n}/>)}</div></div>)}</div>
          {priority ? <>
            <p className="wa-section-label">START HERE · {priority.name.toUpperCase()}</p>
            <div className="wa-insight"><h3>{priority.friction}</h3><p><strong>Try this first.</strong> {priority.action}</p><div className="wa-thought"><span>A QUESTION WORTH ASKING</span><p>{priority.prompt}</p></div></div>
            <div className="wa-scenario"><h3>What if this part ran smoothly?</h3><p>{priority.outcome}</p><Button variant="outline" aria-pressed={scenario} onClick={() => setScenario(!scenario)}>{scenario ? 'Show my current snapshot' : `Explore a smoother ${priority.name.toLowerCase()}`}<ArrowRight size={17}/></Button><div className="wa-scenario-score" aria-live="polite">{scenario ? <><strong>{score} → {potential}</strong><span>Illustrative workflow score if {priority.name.toLowerCase()} reached 3/3, with all other answers unchanged.</span></> : <span>Try the “what if” to see how improving this one area changes your score.</span>}</div><small>This is a scoring scenario, not a predicted business result or a guarantee of time or money saved.</small></div>
            {gaps[1] && <div className="wa-next"><span>NEXT TO EXPLORE · {gaps[1].name.toUpperCase()}</span><p>{gaps[1].action}</p></div>}
            <p className="wa-fit">Where we could help: <strong>{priority.offer}.</strong> We’d first check whether a process change or your existing tools can solve it.</p>
          </> : <div className="wa-insight"><h3>Keep the good habits. Test the exceptions.</h3><p>Your answers show strong practices across all five areas. Walk through a delayed approval or an unusual customer request to check whether the workflow still holds up.</p><div className="wa-thought"><span>A QUESTION WORTH ASKING</span><p>If a key person were away tomorrow, would work keep moving?</p></div></div>}
          <div className="wa-next"><span>MAKE IT MEASURABLE</span><p>Track one real workflow for a week: time spent chasing, duplicate entries or handoff delays. Try one change, then compare the same measure. That’s how you find the actual impact.</p></div>
          <details className="wa-method"><summary>How is this score calculated?</summary><p>Each answer earns 0, 1, 2 or 3 points, from the first option to the last. All five areas have equal weight. Your total out of 15 is converted to 100 and rounded. The lowest-scoring area comes first; ties follow question order. This is a simple self-assessment, not a validated audit, industry benchmark or measure of business performance.</p></details>
          <div className="wa-controls wa-result-controls"><Button variant="ghost" onClick={() => { setScenario(false); setStep(0); }}>Edit answers</Button><Button variant="ghost" onClick={restart}><RotateCcw size={15}/>Start fresh</Button><Button className="wa-primary" asChild><a href="/lets-talk">Talk through my workflow <ArrowUpRight size={17}/></a></Button></div>
          <p className="wa-footnote">Your answers aren’t sent with this link. Bring the insight that caught your attention.</p>
        </div>}
      </div>
    </DialogContent>
  </Dialog>;
}
