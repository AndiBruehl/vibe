import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

type VibeLogoProps = {
  height?: number;
  width?: number;
};

export default function VibeLogo({ height = 92, width = 180 }: VibeLogoProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 220 110"
      accessibilityLabel="VIBE Logo"
    >
      <Defs>
        <LinearGradient id="vibeFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ff3f6e" />
          <Stop offset="0.45" stopColor="#ff8a3d" />
          <Stop offset="1" stopColor="#ffe45c" />
        </LinearGradient>
      </Defs>
      <SvgText
        x="24"
        y="72"
        fill="#5eead4"
        fontSize="54"
        fontWeight="900"
        originX="110"
        originY="55"
        rotation="-9"
      >
        VIBE
      </SvgText>
      <SvgText
        x="18"
        y="68"
        fill="#7c3aed"
        fontSize="54"
        fontWeight="900"
        originX="110"
        originY="55"
        rotation="-9"
      >
        VIBE
      </SvgText>
      <SvgText
        x="20"
        y="70"
        fill="url(#vibeFill)"
        fontSize="54"
        fontWeight="900"
        originX="110"
        originY="55"
        rotation="-9"
        stroke="#ffffff"
        strokeWidth="3"
      >
        VIBE
      </SvgText>
      <Path
        d="M34 83 C76 97 132 94 184 74"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <Path
        d="M36 84 C80 96 134 92 182 75"
        fill="none"
        stroke="#ff3f6e"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </Svg>
  );
}
