gsap.defaults({ overwrite: "auto" });

gsap.set(".vert-timeline__img-wrap > *", { xPercent: -50, yPercent: -50 });

const contentMarkers = gsap.utils.toArray(".vert-timeline__text");

// Set up our scroll trigger
const ST = ScrollTrigger.create({
  trigger: ".vert-timeline__wrap",
  start: "top top",
  end: "bottom bottom",
  onUpdate: getCurrentSection,
  pin: ".vert-timeline__img-wrap",
  pinSpacing: false
});

// Set up our content behaviors
contentMarkers.forEach((marker) => {
  marker.content = document.querySelector(`#${marker.dataset.markerContent}`);

  marker.content.enter = function () {
    gsap.fromTo(
      marker.content,
      { autoAlpha: 0 },
      { duration: 0.3, autoAlpha: 1 }
    );
  };

  marker.content.leave = function () {
    gsap.to(marker.content, { duration: 0.1, autoAlpha: 0 });
  };
});

// Handle the updated position
let lastContent;
function getCurrentSection() {
  let newContent;
  const currScroll = scrollY;

  // Find the current section
  contentMarkers.forEach((marker) => {
    if (currScroll > marker.y) {
      newContent = marker.content;
    }
  });

  // If the current section is different than that last, animate in
  if (
    newContent &&
    (lastContent == null || !newContent.isSameNode(lastContent))
  ) {
    // Fade out last section
    if (lastContent) {
      lastContent.leave();
    }

    // Animate in new section
    newContent.enter();

    lastContent = newContent;
  }
}

const media = window.matchMedia("screen and (max-width: 600px)");
ScrollTrigger.addEventListener("refreshInit", checkSTState);
checkSTState();

function checkSTState() {
  contentMarkers.forEach((marker) => {
    marker.y = marker.getBoundingClientRect().top;
  });
  
  if (media.matches) {
    ST.disable();
  } else {
    ST.enable();
  }
}