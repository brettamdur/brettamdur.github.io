# what is the percentage breakdown of households by income category in ALICE data?
nyAliceWC2021

# Applying ALICE thresholds to ACS data: created new income categories for households below poverty line, below double poverty line, below ALICE line, and above ALICE line.
# NOTE: Median persons per household in Westchester is is 2.63, accoring to https://www.census.gov/quickfacts/westchestercountynewyork.  So I rounded up to 3, and used the FPL for a household of 3.  That's $21,960 (according to https://aspe.hhs.gov/2021-poverty-guidelines), which I rounded down to $20,000, since $20k is a start number for a Census bracket.
bucketsByTract_combined %>%
      filter(county == "Westchester") %>%
      filter(highLow == "Lower Income" | highLow == "Higher Income") %>%
      ggplot(aes(x = highLow, y = estimate, fill = income)) +
      geom_col() +
      labs(x = "", y = "Number of Households", title = "Number of Households by Higher / Lower Income in Westchester County") +
      scale_y_continuous(labels = comma_format()) +
      scale_fill_manual(values=c(
        "aboveALICE"="#7eb0d5", 
        "belowALICE"="#8bd3c7", 
        "belowDoublePoverty"="#ffee65",
        "belowPoverty" = "#ffb55a"
      )) +
      # order the categories in the x axis by the order in incomeCategories
      scale_x_discrete(limits = c("Lower Income", "Higher Income" )) +
      theme(
        panel.background = element_rect(fill = "white"),
        plot.title = element_text(hjust = 0.5, size = 25),
        axis.text.x = element_text(size = 15),
        axis.ticks.x = element_blank(),
      )        

# You can see from chart that lower income is more than half of higher income.  
# Why? What went wrong?
# Of course, the manipulation I did to get ALICE data into Cesus buckets is part of it.  
# But also, we have different total household numbers in the two datasets:

    # how many total households are there in Westchester according to ALICE data?
    nyAlice[nyAlice$Year == 2021,] %>% 
        filter(County == "Westchester") %>% 
        pull (Households)

    # how many total households are there in Westchester according to census data?
    bucketsByTract %>% 
        filter(county == "Westchester") %>% 
        select(estimate) %>% 
        summarize(total = sum(estimate)) %>%
        pull(total)

    # what's the percentage difference between the two total household numbers?  ALICE is 10% lower than Census.
    (nyAlice[nyAlice$Year == 2021,] %>% 
        filter(County == "Westchester") %>% 
        select(Households) 
        / 
        bucketsByTract %>% 
        filter(county == "Westchester") %>% 
        select(estimate) %>% 
        summarize(sum(estimate))) - 1

    # According to ALICE, lower income households should be half of higher income households (1/3 vs 2/3).  By how much is census data off?
    totalLowWC <- bucketsByTract_combined %>%
        filter(county == "Westchester") %>%
        filter(highLow == "Lower Income" | highLow == "Higher Income") %>%
        filter(!income == "aboveALICE") %>% summarize(total = sum(estimate)) %>% 
        pull(total)

    totalHighWC <- bucketsByTract_combined %>%
        filter(county == "Westchester") %>%
        filter(highLow == "Lower Income" | highLow == "Higher Income") %>%
        filter(income == "aboveALICE") %>% summarize(total = sum(estimate)) %>% 
        pull(total)

    (totalLowWC / totalHighWC) - 0.5
        
    # Check out B17024: Age by ratio of income to poverty level in the past 12 months
    # 5 VS ONE.  ALICE data detail
    # R code
    # sample iframe for embedding
    # code start

# FPL for different sized families:
# https://aspe.hhs.gov/2021-poverty-guidelines

