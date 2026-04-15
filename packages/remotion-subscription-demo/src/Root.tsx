import { Composition } from "remotion";
import React from "react";
import { FPS, LOOP_FRAMES, SIZE } from "./constants";
import { SubscriptionLoop } from "./SubscriptionLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SubscriptionLoop"
        component={SubscriptionLoop}
        durationInFrames={LOOP_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
        defaultProps={{}}
      />
    </>
  );
};
