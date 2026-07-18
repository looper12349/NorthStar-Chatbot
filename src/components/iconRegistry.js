/**
 * Icon registry: maps semantic icon keys (used by engine/data) to MUI icons.
 * The engine never imports MUI — it emits string keys; the UI resolves them here.
 * Also exports NorthStarIcon, the brand mark (the original 4-point star path).
 */
import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import HikingIcon from '@mui/icons-material/Hiking';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BackpackIcon from '@mui/icons-material/Backpack';
import LayersIcon from '@mui/icons-material/Layers';
import CabinIcon from '@mui/icons-material/Cabin';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GroupsIcon from '@mui/icons-material/Groups';
import FilterHdrIcon from '@mui/icons-material/FilterHdr';
import RouteIcon from '@mui/icons-material/Route';
import LandscapeIcon from '@mui/icons-material/Landscape';
import TerrainIcon from '@mui/icons-material/Terrain';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DownhillSkiingIcon from '@mui/icons-material/DownhillSkiing';
import SnowshoeingIcon from '@mui/icons-material/Snowshoeing';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import CommuteIcon from '@mui/icons-material/Commute';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

/** Brand mark: four-point north star. */
export function NorthStarIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6L12 1z" />
    </SvgIcon>
  );
}

export const ICONS = {
  // activities
  hiking: HikingIcon,
  camping: CabinIcon,
  climbing: FilterHdrIcon,
  ski: DownhillSkiingIcon,
  bike: DirectionsBikeIcon,
  // needs
  umbrella: UmbrellaIcon,
  footwear: DirectionsWalkIcon,
  backpack: BackpackIcon,
  layers: LayersIcon,
  car: DirectionsCarIcon,
  snow: AcUnitIcon,
  family: GroupsIcon,
  route: RouteIcon,
  alpine: LandscapeIcon,
  boulder: TerrainIcon,
  safety: HealthAndSafetyIcon,
  snowshoe: SnowshoeingIcon,
  mtb: PedalBikeIcon,
  ice: AcUnitIcon,
  commute: CommuteIcon,
  // generic actions
  order: LocalShippingIcon,
  returns: AssignmentReturnIcon,
  recommend: AutoAwesomeIcon,
  agent: SupportAgentIcon,
  home: HomeIcon,
  retry: RefreshIcon,
  check: CheckCircleIcon,
  help: HelpIcon,
  issue: ReportProblemOutlinedIcon
};

/** Default icons for common quick-reply values the engine doesn't tag. */
const REPLY_VALUE_ICONS = {
  'track order': 'order',
  'track another order': 'order',
  'return policy': 'returns',
  'recommend gear': 'recommend',
  'talk to agent': 'agent',
  'main menu': 'home',
  'try again': 'retry',
  'all good': 'check',
  'more questions': 'help',
  'more questions about returns': 'help'
};

/**
 * Resolve the MUI icon component for a quick reply.
 * Explicit engine-provided keys win; falls back by value; null when unknown.
 */
export function iconForReply(reply) {
  const key = reply.icon || REPLY_VALUE_ICONS[reply.value];
  return key ? ICONS[key] || null : null;
}
