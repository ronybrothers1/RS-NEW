import {
  initBotId,
} from "botid/client/core";

initBotId({
  protect: [
    {
      path:
        "/api/donasi/proof/upload",
      method:
        "POST",
      advancedOptions: {
        checkLevel:
          "basic",
      },
    },
    {
      path:
        "/donasi",
      method:
        "POST",
      advancedOptions: {
        checkLevel:
          "basic",
      },
    },
  ],
});