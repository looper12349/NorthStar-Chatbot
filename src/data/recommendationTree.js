/**
 * Product Recommendation Decision Tree
 * Two-level tree: Activity Type → Specific Need → Recommendation
 *
 * `icon` values are semantic keys resolved by the UI icon registry
 * (src/components/iconRegistry.js) — not MUI component names.
 */

export const recommendationTree = {
  activities: {
    hiking: {
      label: "Hiking & Trekking",
      icon: "hiking",
      needs: {
        weatherProtection: {
          label: "Weather Protection",
          icon: "umbrella",
          recommendation: {
            category: "Waterproof Jackets & Rain Gear",
            description: "Our Gore-Tex shell jackets are ideal for unpredictable trail conditions — lightweight, packable, and fully waterproof.",
            tip: "Look for sealed seams and an adjustable hood for maximum coverage on the trail."
          }
        },
        footwear: {
          label: "Footwear",
          icon: "footwear",
          recommendation: {
            category: "Hiking Boots & Trail Shoes",
            description: "From day hikes to multi-day treks, we have boots with ankle support and trail runners for fast-and-light adventures.",
            tip: "Break in new boots on short walks before hitting the trail to avoid blisters."
          }
        },
        carryingGear: {
          label: "Carrying Gear",
          icon: "backpack",
          recommendation: {
            category: "Backpacks & Daypacks",
            description: "Our packs range from 20L daypacks to 65L expedition backpacks with adjustable suspension systems.",
            tip: "Choose a pack with a hip belt to transfer weight off your shoulders on longer hikes."
          }
        },
        layering: {
          label: "Layering & Comfort",
          icon: "layers",
          recommendation: {
            category: "Base Layers & Insulation",
            description: "Merino wool and synthetic base layers keep you warm without overheating, plus insulated mid-layers for cold conditions.",
            tip: "Layer with moisture-wicking base, insulating mid, and waterproof outer for maximum versatility."
          }
        }
      }
    },
    camping: {
      label: "Camping & Shelter",
      icon: "camping",
      needs: {
        carCamping: {
          label: "Car Camping",
          icon: "car",
          recommendation: {
            category: "Family Tents & Car Camping Gear",
            description: "Spacious 4-6 person tents with easy setup, plus camp chairs, coolers, and lanterns for comfortable base camp living.",
            tip: "Bring a ground tarp to protect your tent floor and keep moisture out."
          }
        },
        backpacking: {
          label: "Backpacking",
          icon: "backpack",
          recommendation: {
            category: "Lightweight Tents & Sleeping Systems",
            description: "Ultralight 1-2 person tents and compact sleeping bags designed for long-distance trekking and minimalist camping.",
            tip: "Choose a sleeping bag rated 10°F colder than your expected low temperature."
          }
        },
        winterCamping: {
          label: "Winter Camping",
          icon: "snow",
          recommendation: {
            category: "4-Season Tents & Cold-Weather Gear",
            description: "Heavy-duty tents built to handle snow loads, plus insulated sleeping pads and sub-zero rated sleeping bags.",
            tip: "Use an insulated sleeping pad with an R-value of 5+ for winter snow camping."
          }
        },
        familyCamping: {
          label: "Family Camping",
          icon: "family",
          recommendation: {
            category: "Group Tents & Camp Essentials",
            description: "Large cabin-style tents with room dividers, camp kitchens, and kid-friendly gear for family adventures.",
            tip: "Practice setting up your tent at home before your first family trip to avoid stress."
          }
        }
      }
    },
    climbing: {
      label: "Climbing",
      icon: "climbing",
      needs: {
        sportClimbing: {
          label: "Sport Climbing",
          icon: "route",
          recommendation: {
            category: "Climbing Ropes & Quickdraws",
            description: "Dynamic ropes, quickdraw sets, and belay devices designed for bolted sport climbing routes.",
            tip: "A 60-70m rope covers most sport climbing routes — check your crag's route length."
          }
        },
        alpine: {
          label: "Alpine Climbing",
          icon: "alpine",
          recommendation: {
            category: "Alpine Climbing Systems",
            description: "Ice axes, crampons, alpine harnesses, and technical mountaineering gear for high-altitude objectives.",
            tip: "Always carry extra layers and emergency gear — alpine weather changes fast."
          }
        },
        bouldering: {
          label: "Bouldering",
          icon: "boulder",
          recommendation: {
            category: "Crash Pads & Climbing Shoes",
            description: "Thick crash pads for safe landings and precision climbing shoes with sticky rubber for boulder problems.",
            tip: "Downsize climbing shoes 1-2 sizes for maximum precision on tiny footholds."
          }
        },
        gearSafety: {
          label: "Gear & Safety",
          icon: "safety",
          recommendation: {
            category: "Harnesses, Helmets & Protection",
            description: "UIAA-certified harnesses, climbing helmets, carabiners, and passive/active protection for trad climbing.",
            tip: "Replace climbing helmets after any significant impact, even if damage isn't visible."
          }
        }
      }
    },
    winterSports: {
      label: "Winter Sports",
      icon: "ski",
      needs: {
        skiing: {
          label: "Skiing",
          icon: "ski",
          recommendation: {
            category: "Ski Jackets & Snow Pants",
            description: "Insulated and shell jackets with snow skirts, waterproof gloves, and thermal base layers for resort and backcountry skiing.",
            tip: "Layer with a moisture-wicking base and insulated mid-layer for temperature control."
          }
        },
        snowshoeing: {
          label: "Snowshoeing",
          icon: "snowshoe",
          recommendation: {
            category: "Snowshoes & Winter Trekking Gear",
            description: "Aluminum-frame snowshoes with aggressive traction, plus insulated boots and gaiters for deep snow travel.",
            tip: "Choose snowshoes rated for your body weight plus 10-15 lbs of gear."
          }
        },
        iceClimbing: {
          label: "Ice Climbing",
          icon: "ice",
          recommendation: {
            category: "Ice Axes & Crampons",
            description: "Technical ice tools, 12-point crampons, and insulated gloves designed for vertical ice and mixed terrain.",
            tip: "Keep your crampons sharp — dull points won't bite on hard ice."
          }
        },
        winterHiking: {
          label: "Winter Hiking",
          icon: "hiking",
          recommendation: {
            category: "Insulated Boots & Microspikes",
            description: "Waterproof insulated hiking boots and traction devices like microspikes or crampons for icy trails.",
            tip: "Bring extra socks and hand warmers — extremities get cold fast in winter."
          }
        }
      }
    },
    cycling: {
      label: "Cycling & Adventure",
      icon: "bike",
      needs: {
        road: {
          label: "Road Cycling",
          icon: "bike",
          recommendation: {
            category: "Cycling Jerseys & Road Gear",
            description: "Moisture-wicking jerseys, padded shorts, and lightweight helmets for road cycling and long-distance rides.",
            tip: "Wear padded shorts even on short rides to prevent saddle soreness."
          }
        },
        mountain: {
          label: "Mountain Biking",
          icon: "mtb",
          recommendation: {
            category: "MTB Protective Gear & Apparel",
            description: "Full-face helmets, knee/elbow pads, gloves, and durable trail apparel for aggressive mountain biking.",
            tip: "A full-face helmet is essential for downhill and enduro riding."
          }
        },
        bikepacking: {
          label: "Bikepacking",
          icon: "backpack",
          recommendation: {
            category: "Bikepacking Bags & Gear",
            description: "Frame bags, seat packs, and handlebar rolls designed for multi-day bike touring and off-road adventures.",
            tip: "Distribute weight evenly across frame, seat, and handlebars for stable handling."
          }
        },
        commuting: {
          label: "Commuting",
          icon: "commute",
          recommendation: {
            category: "Urban Cycling Essentials",
            description: "Reflective gear, waterproof panniers, bike lights, and comfortable everyday cycling apparel for city riding.",
            tip: "Always use front and rear lights, even during the day, for maximum visibility."
          }
        }
      }
    }
  }
};
