
library(tidycensus)
library(tidyverse)
census_api_key("fb913302b479cf7bf43a2e3d397436921a86789e", install = "TRUE")
readRenviron("~/.Renviron")

nyTract <- get_acs(geography = "tract",
              variables = c(medincome = "B19013_001"), 
              state = "PA", 
              year = 2021)

# change all instances of "St. Lawrence County" to "Saint Lawrence County"
# (the period messes up the regex below)
nyTract <- nyTract %>% 
  mutate(NAME = str_replace(NAME, "St. Lawrence County", "Saint Lawrence County"))


# parse the NAME variable into county and tract, keeping the numbers after the decimal point in the tract, but deleting ", New York" from the county name
nyTractByCounty <- nyTract %>% 
  mutate(county = str_extract(NAME, ".*,")) %>%
  select(-NAME)


# create a new variable called tract that is everything before the first comma in county
nyTractByCounty <- nyTractByCounty %>% 
  mutate(tract = sub(",.*", "", county)) %>%
  mutate(tract = sub("Census Tract ", "", tract)) %>%
  mutate(county = (str_extract(county, "(?<=,\\s)[[:alpha:]\\s]+(?=,)"))) %>%
  mutate(county = str_replace(county, " County", ""))

nyIncomeDeviation <- nyTractByCounty %>% 
    group_by(county) %>%
    summarise(sd = sd(estimate, na.rm = TRUE)) %>%
    arrange(desc(sd))

# create a dot chart showing the standard deviation of median income by county, sorted from top to bottom in descending order
nyIncomeDeviation %>% 
  ggplot(aes(x = reorder(county, sd), y = sd)) +
  geom_point() +
  geom_segment(aes(xend = reorder(county, -sd), yend = 0)) +
  coord_flip() +
  labs(x = "County", y = "Standard Deviation of Median Income", title = "Within County Standard Deviation of Median Income by Tract in PA") +
  theme(plot.title = element_text(hjust = 0.5))

# create a box and whiskers plot from nyTractByCounty showing the distribution of median income by county, sorted from top to bottom in descending order of median income
nyTractByCounty$ordered <- factor(nyTractByCounty$county, levels = nyIncomeDeviation$county)

nyTractByCounty %>% 
  ggplot(aes(x = county, y = estimate)) +
  geom_boxplot() +
  coord_flip() +
  labs(x = "County", y = "Median Income", title = "Distribution of Median Income by County in New York State") +
  theme(plot.title = element_text(hjust = 0.5))

# create a histogram for values of median income in all counties.  This should be faceted, with one histogram per county
nyTractByCounty %>% 
  ggplot(aes(x = estimate)) +
  geom_histogram() +
  labs(x = "Median Income (000s)", y = "Frequency (No. of Tracts)", title = "Distribution of Median Income Within Counties by Tract in PA") +
  theme(plot.title = element_text(hjust = 0.5)) +
  facet_wrap(~county) +
  # divide the x axis values by 1000 so that the values are in thousands of dollars
    scale_x_continuous(labels = function(x) x/1000)




##### USED TO FIND NA COUNTY NAME IN nyTractByCounty #####
# create vector of all NY County names, copied from https://www.p12.nysed.gov/repcrd2005/links/nycounty.shtml
my_data <- read.table(pipe("pbpaste"), header = FALSE, sep = "\t")

my_data <- my_data$V1

# remove the word county from all elements of my_data
my_data <- str_replace_all(my_data, " County", "")

# find values that are in my_data but not in nyIncomeDeviation$county.
# Shows that problem was St. Lawrence County (because of the period).
setdiff(my_data, nyIncomeDeviation$county)


# Use the mtcars dataset as an example
data(mtcars)

# Calculate the standard deviation for each category
grouped_sd <- mtcars %>%
  group_by(gear) %>%
  summarize(sd = sd(mpg)) %>%
  arrange(-sd) # Sort in descending order

# Create a new factor variable with levels ordered by standard deviation
mtcars$gear_ordered <- factor(mtcars$gear, levels = grouped_sd$gear)

# Create the horizontal box and whiskers plot with ggplot2
ggplot(mtcars, aes(x = mpg, y = gear_ordered)) +
  geom_boxplot() +
  labs(y = "Gear", x = "Miles per Gallon") +
  theme_minimal()


