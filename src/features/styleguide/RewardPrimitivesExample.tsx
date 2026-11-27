import { useState } from "react";
import CandidateList from "../../components/session/CandidateList";
import SessionCandidate from "../../components/session/SessionCandidate";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import ControlRow from "../../components/ui/ControlRow";
import Explainer from "../../components/ui/Explainer";
import FormLabel from "../../components/ui/FormLabel";
import IconBadge from "../../components/ui/IconBadge";
import RoundSummary from "../../components/ui/RoundSummary";
import StatusPill from "../../components/ui/StatusPill";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";
import RewardSetupForm from "../host-live/RewardSetupForm";
import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";

const sampleChallenge = {
  id: "sample",
  title: "Make an entrance",
  kind: "main" as const,
  round_number: 1,
  points: 20,
};

export default function RewardPrimitivesExample() {
  const [method, setMethod] = useState<RewardMethod>("voting");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<RewardTargetKind>("player");
  const [points, setPoints] = useState(sampleChallenge.points);
  return (
    <Example
      title="Reward fields, summaries and award controls"
      source="src/components/ui/RoundSummary.tsx + FormLabel.tsx + src/components/session/CandidateList.tsx"
      code={
        '<RoundSummary title="Make an entrance" detail="Host awards · 20 points" marker={<IconBadge variant="method">HOST</IconBadge>} status={<StatusPill variant="reward" tone="open">In progress</StatusPill>} />'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel
            variant="session"
            stacked
            aria-label="Local reward primitives"
          >
            <RewardSetupForm
              busy={false}
              currentRoundOnly
              currentChallenge={sampleChallenge}
              decideRewardInGame
              rewardChallengeId={sampleChallenge.id}
              setRewardChallengeId={() => {}}
              challenges={[sampleChallenge]}
              setRewardPoints={setPoints}
              rewardMethod={method}
              setRewardMethod={setMethod}
              enabledRewardMethods={[
                "host_awards",
                "audience_cheers",
                "voting",
              ]}
              rewardMethodLabel={(value) => value}
              rewardTargetKind={target}
              setRewardTargetKind={setTarget}
              setSelectedRewardWinnerIds={() => {}}
              session={{ teams_enabled: true }}
              teams={[{ id: "sample-team" }]}
              rewardPoints={points}
              startRewardRound={async (event) => {
                event.preventDefault();
                setNotice(`Sample reward: ${target}, ${points} points.`);
              }}
              setShowRewardSetup={() => setNotice("Sample cancelled.")}
            />
            {notice && <output>{notice}</output>}
            <RoundSummary
              title="Make an entrance"
              detail="Host awards · 20 points per winner · Players"
              marker={
                <IconBadge variant="method" tone="lime">
                  HOST
                </IconBadge>
              }
              status={
                <StatusPill variant="reward" tone="open">
                  In progress
                </StatusPill>
              }
            />
            <RoundSummary
              title="Team portrait"
              detail="Audience cheers · 20 points per winner · Teams"
              marker={
                <IconBadge variant="method" tone="pink">
                  CHEER
                </IconBadge>
              }
              status={
                <StatusPill variant="reward" tone="completed">
                  Results shown
                </StatusPill>
              }
            />
            <IconBadge variant="method" tone="violet">
              VOTE
            </IconBadge>
            <FormLabel variant="reward">
              <span>Sample reward method</span>
              <select value="voting" disabled>
                <option value="voting">Player voting</option>
              </select>
            </FormLabel>
            <Explainer variant="reward">
              <strong>Select the winners</strong>
              <span>
                This local sample shows disabled award controls. Commands and
                confirmation belong to the feature.
              </span>
            </Explainer>
            <FormLabel variant="award-points">
              <span>Sample points per winner</span>
              <input type="number" min={0} max={10000} value={20} disabled />
            </FormLabel>
            <CandidateList>
              <SessionCandidate
                name="Alex"
                avatarUrl={`${import.meta.env.BASE_URL}chaos-logo.png`}
                detail="Player · 120 pts"
                selected
                busy
                actionLabel="Select winner"
                onSelect={() => {}}
              />
              <SessionCandidate
                name="Sam"
                detail="Player · 100 pts"
                selected={false}
              />
            </CandidateList>
            <ControlRow variant="reward">
              <Button
                type="button"
                variant="session-ghost"
                fullWidth={false}
                disabled
              >
                Cancel sample
              </Button>
              <Button
                type="button"
                variant="session-action"
                fullWidth={false}
                disabled
              >
                Confirm sample winners
              </Button>
            </ControlRow>
          </ContentPanel>
        </HostManagement>
      </SessionPreview>
    </Example>
  );
}
