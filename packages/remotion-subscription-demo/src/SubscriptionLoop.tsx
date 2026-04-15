import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import { LOOP_FRAMES } from "./constants";
import { colors } from "./theme";

loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

const FADE_FRAMES = 22;
const INNER = LOOP_FRAMES - 2 * FADE_FRAMES;

/** Portræt “logisk” bredde (typografi skaleres herfra) */
const BASE_W = 390;

const PHONE = {
  bezel: 12,
  outerR: 46,
  innerR: 36,
  /** Skærmflate i px — høj format som mobil */
  screenW: 378,
  screenH: 728,
} as const;

const ZOOM_IN_FR = 1.38;

const ZOOM_IN_START = 18;
const CLICK_START = 56;
const CLICK_END = 66;
const OPEN_START = 68;
const ZOOM_OUT_START = 128;

export const SubscriptionLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [LOOP_FRAMES - FADE_FRAMES, LOOP_FRAMES],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const shellOpacity = Math.min(fadeIn, fadeOut);

  const animFrame =
    frame < FADE_FRAMES
      ? 0
      : frame >= LOOP_FRAMES - FADE_FRAMES
        ? INNER - 1
        : Math.min(frame - FADE_FRAMES, INNER - 1);

  const zoomInAmount =
    animFrame < ZOOM_IN_START
      ? 0
      : Math.min(
          spring({
            frame: animFrame - ZOOM_IN_START,
            fps,
            config: { damping: 18, stiffness: 100, mass: 0.85 },
          }),
          1,
        );

  const zoomOutAmount =
    animFrame < ZOOM_OUT_START
      ? 0
      : Math.min(
          spring({
            frame: animFrame - ZOOM_OUT_START,
            fps,
            config: { damping: 19, stiffness: 96, mass: 0.9 },
          }),
          1,
        );

  const zoomFactor =
    1 + (ZOOM_IN_FR - 1) * zoomInAmount * (1 - zoomOutAmount);

  const rawOpen = spring({
    frame: animFrame - OPEN_START,
    fps,
    config: { damping: 17, stiffness: 128, mass: 0.9 },
  });
  const openProgress = animFrame < OPEN_START ? 0 : Math.min(rawOpen, 1);

  const drawerY = interpolate(openProgress, [0, 1], [100, 0]);
  const overlayA = interpolate(openProgress, [0, 1], [0, 1]);

  const press =
    animFrame >= CLICK_START && animFrame < CLICK_END
      ? spring({
          frame: animFrame - CLICK_START,
          fps,
          config: { damping: 12, stiffness: 260 },
        })
      : animFrame >= CLICK_END
        ? 1
        : 0;
  const buttonScale = interpolate(press, [0, 0.5, 1], [1, 0.94, 1]);

  const phoneOuterW = PHONE.screenW + PHONE.bezel * 2;
  const phoneOuterH = PHONE.screenH + PHONE.bezel * 2 + 20;

  const fitScale = Math.min(1080 / phoneOuterW, 1080 / phoneOuterH) * 0.9;
  const cameraScale = fitScale * zoomFactor;

  const pad = Math.round(PHONE.screenW * 0.065);
  const cardRadius = 18;
  const scale = PHONE.screenW / BASE_W;

  return (
    <AbsoluteFill
      style={{
        background: colors.stageGradient,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          opacity: shellOpacity,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `scale(${cameraScale})`,
              transformOrigin: "center center",
              width: phoneOuterW,
              height: phoneOuterH,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: PHONE.outerR,
                background: `linear-gradient(180deg, ${colors.phoneBody} 0%, #0a0a0c 100%)`,
                boxShadow: `
                  0 40px 80px rgba(0, 8, 30, 0.28),
                  0 16px 32px rgba(0, 0, 0, 0.18),
                  inset 0 1px 0 ${colors.phoneBezelShine}
                `,
                padding: PHONE.bezel,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: PHONE.innerR,
                  backgroundColor: colors.bg,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    padding: pad,
                    paddingBottom: pad * 0.9,
                    boxSizing: "border-box",
                    gap: pad * 0.45,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13 * scale,
                      color: colors.muted,
                      letterSpacing: 0.2,
                    }}
                  >
                    Min konto / Abonnementer
                  </div>
                  <div
                    style={{
                      fontSize: 28 * scale,
                      fontWeight: 700,
                      color: colors.ink,
                      letterSpacing: -0.4,
                      marginBottom: pad * 0.05,
                    }}
                  >
                    Abonnementer
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: pad * 0.45,
                      overflow: "hidden",
                    }}
                  >
                    <SubscriptionCard
                      id="#01KNWSRT"
                      scale={scale}
                      cardRadius={cardRadius}
                      buttonScale={buttonScale}
                      onDetailsOpacity={1}
                    />
                    <SubscriptionCard
                      id="#01KABCDE"
                      scale={scale}
                      cardRadius={cardRadius}
                      buttonScale={1}
                      onDetailsOpacity={0.35}
                    />
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: colors.overlay,
                      opacity: overlayA,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: "86%",
                      transform: `translateY(${drawerY}%)`,
                      willChange: "transform",
                      backgroundColor: colors.bg,
                      borderTopLeftRadius: 20 * scale,
                      borderTopRightRadius: 20 * scale,
                      boxShadow: "0 -12px 40px rgba(0,0,0,0.08)",
                      padding: pad,
                      paddingTop: pad * 0.75,
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      gap: pad * 0.4,
                      overflow: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        marginBottom: pad * 0.1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 19 * scale,
                          fontWeight: 700,
                          color: colors.ink,
                        }}
                      >
                        Abonnementsdetaljer
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          right: 0,
                          fontSize: 22 * scale,
                          color: colors.muted,
                          fontWeight: 400,
                        }}
                      >
                        ×
                      </span>
                    </div>

                    <div
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: pad * 0.45,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 11 * scale,
                              color: colors.muted,
                              letterSpacing: 1,
                              textTransform: "uppercase",
                            }}
                          >
                            Abonnement #01KNWSRT
                          </div>
                          <div
                            style={{
                              fontSize: 15 * scale,
                              color: colors.muted,
                              marginTop: 4 * scale,
                            }}
                          >
                            Hver 4 uge · 5% rabat
                          </div>
                        </div>
                        <span
                          style={{
                            backgroundColor: colors.badgeBg,
                            color: colors.badgeText,
                            fontSize: 12 * scale,
                            fontWeight: 600,
                            padding: "5px 10px",
                            borderRadius: 999,
                          }}
                        >
                          Aktiv
                        </span>
                      </div>
                      <DetailRow
                        label="Frekvens"
                        value="Hver 4. uge"
                        scale={scale}
                      />
                      <DetailRow
                        label="Næste levering"
                        value="8. maj 2026"
                        scale={scale}
                      />
                      <DetailRow label="Leveringer" value="1" scale={scale} />
                      <DetailRow
                        label="Næste springes over"
                        value="Nej"
                        scale={scale}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 11 * scale,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        color: colors.ink,
                        textTransform: "uppercase",
                        marginTop: pad * 0.05,
                      }}
                    >
                      Abonnementsvarer
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: pad * 0.35,
                        alignItems: "flex-start",
                        paddingTop: pad * 0.1,
                      }}
                    >
                      <ProductThumb scale={scale} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            alignItems: "baseline",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 15 * scale,
                              fontWeight: 700,
                              color: colors.ink,
                              lineHeight: 1.25,
                            }}
                          >
                            Collagen Night Wrapping Mask · 75 ml
                          </div>
                          <span
                            style={{
                              fontSize: 14 * scale,
                              fontWeight: 600,
                              color: colors.muted,
                              flexShrink: 0,
                            }}
                          >
                            1×
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 13 * scale,
                            color: colors.muted,
                            marginTop: 5 * scale,
                            lineHeight: 1.45,
                          }}
                        >
                          Inkl. 5% abonnementsrabat på fornyelser
                          <br />
                          Pris vises på ordren
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 10 * scale,
                        letterSpacing: 0.8,
                        color: colors.muted,
                        textTransform: "uppercase",
                        marginTop: pad * 0.15,
                      }}
                    >
                      Handlinger
                    </div>
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <GhostButton label="Skip næste levering" scale={scale} />
                      <GhostButton label="Pause abonnement" scale={scale} />
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 12 * scale,
                        color: colors.muted,
                        marginTop: pad * 0.1,
                      }}
                    >
                      Kan annulleres efter 1 leveringer mere
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  alignSelf: "center",
                  width: 104,
                  height: 4,
                  borderRadius: 2,
                  marginTop: 6,
                  backgroundColor: "rgba(255,255,255,0.22)",
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function DetailRow({
  label,
  value,
  scale,
}: {
  label: string;
  value: string;
  scale: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 10 * scale,
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 10 * scale,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14 * scale,
          fontWeight: 600,
          color: colors.ink,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function GhostButton({ label, scale }: { label: string; scale: number }) {
  return (
    <div
      style={{
        border: `1.5px solid ${colors.border}`,
        borderRadius: 999,
        padding: "12px 16px",
        textAlign: "center",
        fontSize: 14 * scale,
        fontWeight: 600,
        color: colors.ink,
        backgroundColor: colors.bg,
      }}
    >
      {label}
    </div>
  );
}

function ProductThumb({ scale }: { scale: number }) {
  const s = Math.round(72 * scale);
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: 12 * scale,
        background:
          "linear-gradient(145deg, #fce7f3 0%, #fbcfe8 45%, #f9a8d4 100%)",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}
    />
  );
}

function SubscriptionCard({
  id,
  scale,
  cardRadius,
  buttonScale,
  onDetailsOpacity,
}: {
  id: string;
  scale: number;
  cardRadius: number;
  buttonScale: number;
  onDetailsOpacity: number;
}) {
  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: cardRadius,
        padding: 16 * scale,
        display: "flex",
        flexDirection: "column",
        gap: 10 * scale,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 17 * scale,
            fontWeight: 700,
            color: colors.ink,
          }}
        >
          {id}
        </span>
        <span
          style={{
            backgroundColor: colors.badgeBg,
            color: colors.badgeText,
            fontSize: 11 * scale,
            fontWeight: 600,
            padding: "4px 9px",
            borderRadius: 999,
          }}
        >
          Aktiv
        </span>
      </div>
      <div style={{ fontSize: 13 * scale, color: colors.muted }}>
        Hver 4 uge · 5% rabat
      </div>
      <div style={{ fontSize: 12 * scale, color: colors.muted }}>
        Næste levering: 8. maj 2026
      </div>
      <div style={{ fontSize: 12 * scale, color: colors.muted }}>
        Leveringer: 1 · Næste springes over: Nej
      </div>
      <div style={{ marginTop: 4 * scale }}>
        <div
          style={{
            display: "inline-flex",
            transform: `scale(${buttonScale})`,
            transformOrigin: "left center",
            opacity: onDetailsOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: colors.primary,
              color: "#fff",
              fontSize: 13 * scale,
              fontWeight: 600,
              padding: "11px 18px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Se detaljer
            <span style={{ opacity: 0.85 }}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
